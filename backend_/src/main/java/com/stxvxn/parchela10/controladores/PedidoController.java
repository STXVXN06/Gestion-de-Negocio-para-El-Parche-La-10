package com.stxvxn.parchela10.controladores;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stxvxn.parchela10.DTO.EditarPedidoDTO;
import com.stxvxn.parchela10.DTO.PedidoComboDTO;
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO;
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO.ProductoEnPedido;
import com.stxvxn.parchela10.DTO.PedidoRequestDTO;
import com.stxvxn.parchela10.entidades.Combo;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.PedidoComboRepository;
import com.stxvxn.parchela10.servicios.ComboServiceImpl;
import com.stxvxn.parchela10.servicios.IngredienteServiceImpl;
import com.stxvxn.parchela10.servicios.PedidoProductoServiceImpl;
import com.stxvxn.parchela10.servicios.PedidoServiceImpl;
import com.stxvxn.parchela10.servicios.ProductoIngredienteServiceImpl;
import com.stxvxn.parchela10.servicios.ProductoServiceImpl;

@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoServiceImpl pedidoService;

    @Autowired
    private ProductoServiceImpl productoService;

    @Autowired
    private PedidoProductoServiceImpl pedidoProductoService;

    @Autowired
    private IngredienteServiceImpl ingredienteService;

    @Autowired
    private ProductoIngredienteServiceImpl productoIngredienteService;

    @Autowired
    private ComboServiceImpl comboService;

    @Autowired
    private PedidoComboRepository pedidoComboRepo;

    @PostMapping
    public ResponseEntity<?> crearPedido(@RequestBody PedidoRequestDTO pedidoDTO) {

        Pedido pedido = new Pedido();
        pedido.setEstado("PENDIENTE");
        pedido.setCantidadP1(pedidoDTO.getCantidadP1());
        pedido.setCantidadC1(pedidoDTO.getCantidadC1());
        pedido.setDetalles(
                pedidoDTO.getDetalles() != null && !pedidoDTO.getDetalles().isBlank()
                ? pedidoDTO.getDetalles()
                : "Sin detalles" // Valor por defecto
        );

        // Total
        Long total = 0L;
        List<PedidoProducto> pedidoProductos = new ArrayList<>();
        List<PedidoCombo> pedidoCombos = new ArrayList<>();
        Map<Long, Double> ingredientesRequeridos = new HashMap<>();

        // Map para errores de combos
        Map<Long, String> combosErrors = new HashMap<>();

        // 1. Procesar productos individuales
        for (PedidoRequestDTO.ProductoCantidadDTO item : pedidoDTO.getProductos()) {
            Producto producto = productoService.findById(item.getProductoId()).orElseThrow();

            PedidoProducto pedidoProducto = new PedidoProducto();
            pedidoProducto.setProducto(producto);
            pedidoProducto.setCantidad(item.getCantidad());
            pedidoProductos.add(pedidoProducto);

            total += producto.getPrecio() * item.getCantidad();

            // Acumular ingredientes
            acumularIngredientes(producto, item.getCantidad(), ingredientesRequeridos);
        }

        // 2. Procesar combos
        for (PedidoComboDTO comboItem : pedidoDTO.getCombos()) {
            Optional<Combo> comboOpt = comboService.findById(comboItem.getComboId());

            if (comboOpt.isEmpty()) {
                combosErrors.put(comboItem.getComboId(), "Combo no encontrado");
                continue;
            }
            Combo combo = comboOpt.orElseThrow();
            // Validar que el combo esté activo
            if (!combo.getActivo()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "El combo con ID " + comboItem.getComboId() + " no está disponible")
                );
            }

            // Crear entidad PedidoCombo
            PedidoCombo pedidoCombo = new PedidoCombo();
            pedidoCombo.setCombo(combo);
            pedidoCombo.setCantidad(comboItem.getCantidad());
            pedidoCombos.add(pedidoCombo);

            // Calcular precio del combo
            Long precioCombo = comboService.calcularPrecioCombo(combo.getId());
            total += precioCombo * comboItem.getCantidad();

            // Acumular ingredientes del combo
            acumularIngredientesCombo(combo, comboItem.getCantidad(), ingredientesRequeridos);
        }

        if (!combosErrors.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Errores en combos solicitados");
            response.put("detalles", combosErrors);
            return ResponseEntity.badRequest().body(response);
        }

        // Validación de stock (unificada para productos y combos)
        List<String> erroresStock = validarStock(ingredientesRequeridos);
        if (!erroresStock.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "mensaje", "Stock insuficiente",
                    "detalles", erroresStock
            ));
        }

        pedido.setTotal(total);
        Optional<Pedido> pedidoCreado = pedidoService.crearPedido(pedido, pedidoProductos, pedidoCombos);
        if (pedidoCreado.isPresent()) {
            return ResponseEntity.ok().body(pedidoCreado.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    // --- Métodos auxiliares ---
    private void acumularIngredientes(Producto producto, Integer cantidad, Map<Long, Double> ingredientesRequeridos) {
        List<ProductoIngrediente> ingredientes = productoIngredienteService.obtenerIngredientesDeProducto(producto.getId());
        for (ProductoIngrediente pi : ingredientes) {
            Long ingredienteId = pi.getIngrediente().getId();
            double requerido = pi.getCantidadNecesaria() * cantidad;
            ingredientesRequeridos.merge(ingredienteId, requerido, Double::sum);
        }
    }

    private void acumularIngredientesCombo(Combo combo, Integer cantidadCombo, Map<Long, Double> ingredientesRequeridos) {
        List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(combo.getId());
        for (ComboProducto cp : productosCombo) {
            acumularIngredientes(cp.getProducto(), cp.getCantidad() * cantidadCombo, ingredientesRequeridos);
        }
    }

    private List<String> validarStock(Map<Long, Double> ingredientesRequeridos) {
        List<String> errores = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : ingredientesRequeridos.entrySet()) {
            Ingrediente ing = ingredienteService.findById(entry.getKey()).orElseThrow();
            if (ing.getCantidadActual() < entry.getValue()) {
                errores.add(String.format("%s: Requerido %.2f, Disponible %.2f",
                        ing.getNombre(), entry.getValue(), ing.getCantidadActual()));
            }
        }
        return errores;
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Pedido> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        Optional<Pedido> pedidoOptional = pedidoService.cambiarEstado(id, estado);

        if (pedidoOptional.isPresent()) {
            return ResponseEntity.ok().body(pedidoOptional.orElseThrow());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<PedidoConProductosDTO>> obtenerTodos() {
        List<Pedido> pedidos = pedidoService.obtenerTodos();
        List<PedidoConProductosDTO> dtos = new ArrayList<>();

        for (Pedido pedido : pedidos) {
            PedidoConProductosDTO dto = new PedidoConProductosDTO();
            dto.setId(pedido.getId());
            dto.setFecha(pedido.getFecha());
            dto.setEstado(pedido.getEstado());
            dto.setTotal(pedido.getTotal());
            dto.setDetalles(pedido.getDetalles());
            dto.setCantidadC1(pedido.getCantidadC1());
            dto.setCantidadP1(pedido.getCantidadP1());

            // Productos individuales
            List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedido.getId());
            dto.setProductos(mapearProductos(productos));

            // Combos
            List<PedidoCombo> combos = pedidoComboRepo.findByPedidoId(pedido.getId());
            dto.setCombos(mapearCombos(combos));

            dtos.add(dto);
        }
        return ResponseEntity.ok(dtos);
    }

    private List<PedidoConProductosDTO.ProductoEnPedido> mapearProductos(List<PedidoProducto> productos) {
        return productos.stream().map(pp -> {
            PedidoConProductosDTO.ProductoEnPedido p = new PedidoConProductosDTO.ProductoEnPedido();
            p.setId(pp.getProducto().getId());
            p.setNombre(pp.getProducto().getNombre());
            p.setPrecio(pp.getProducto().getPrecio());
            p.setCantidad(pp.getCantidad());
            return p;
        }).toList();
    }

    private List<PedidoConProductosDTO.ComboEnPedido> mapearCombos(List<PedidoCombo> combos) {
        return combos.stream().map(pc -> {
            Combo combo = pc.getCombo();
            PedidoConProductosDTO.ComboEnPedido c = new PedidoConProductosDTO.ComboEnPedido();
            c.setId(combo.getId());
            c.setNombre(combo.getNombre());
            c.setPrecio(comboService.calcularPrecioCombo(combo.getId()));
            c.setCantidad(pc.getCantidad());

            // Productos dentro del combo
            List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(combo.getId());
            c.setProductos(productosCombo.stream().map(cp -> {
                PedidoConProductosDTO.ProductoEnPedido p = new PedidoConProductosDTO.ProductoEnPedido();
                p.setId(cp.getProducto().getId());
                p.setNombre(cp.getProducto().getNombre());
                p.setPrecio(cp.getProducto().getPrecio());
                p.setCantidad(cp.getCantidad());
                return p;
            }).toList());

            return c;
        }).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoConProductosDTO> obtenerPedidoPorId(@PathVariable Long id) {
        Optional<Pedido> pedidoOptional = pedidoService.buscarPedidoPorId(id);
        if (pedidoOptional.isPresent()) {
            PedidoConProductosDTO dto = new PedidoConProductosDTO();
            dto.setId(pedidoOptional.get().getId());
            dto.setFecha(pedidoOptional.get().getFecha());
            dto.setEstado(pedidoOptional.get().getEstado());
            dto.setTotal(pedidoOptional.get().getTotal());
            dto.setDetalles(pedidoOptional.get().getDetalles());
            dto.setCantidadP1(pedidoOptional.get().getCantidadP1());
            dto.setCantidadC1(pedidoOptional.get().getCantidadC1());
            List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedidoOptional.orElseThrow().getId());
            List<PedidoCombo> combos = pedidoComboRepo.findByPedidoId(pedidoOptional.orElseThrow().getId());
            dto.setCombos(mapearCombos(combos));

            List<ProductoEnPedido> productosDTO = productos.stream()
                    .map(pp -> {
                        ProductoEnPedido p = new ProductoEnPedido();
                        p.setId(pp.getProducto().getId());
                        p.setNombre(pp.getProducto().getNombre());
                        p.setCantidad(pp.getCantidad());
                        p.setPrecio(pp.getProducto().getPrecio());
                        return p;
                    }).toList();

            dto.setProductos(productosDTO);
            return ResponseEntity.ok().body(dto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/productos")
    public ResponseEntity<PedidoConProductosDTO> obtenerProductosDePedido(@PathVariable Long id) {
        List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(id);
        if (!productos.isEmpty()) {
            Pedido pedido = productos.get(0).getPedido();
            PedidoConProductosDTO dto = new PedidoConProductosDTO();
            dto.setId(pedido.getId());
            dto.setFecha(pedido.getFecha());
            dto.setEstado(pedido.getEstado());
            dto.setTotal(pedido.getTotal());
            dto.setDetalles(pedido.getDetalles());

            List<PedidoConProductosDTO.ProductoEnPedido> listaProductos = productos.stream().map(pp -> {
                PedidoConProductosDTO.ProductoEnPedido p = new PedidoConProductosDTO.ProductoEnPedido();
                p.setId(pp.getProducto().getId());
                p.setNombre(pp.getProducto().getNombre());
                p.setPrecio(pp.getProducto().getPrecio());
                p.setCantidad(pp.getCantidad());

                return p;
            }).toList();

            dto.setProductos(listaProductos);

            return ResponseEntity.ok().body(dto);
        }
        return ResponseEntity.notFound().build();

    }

    @PutMapping("/{pedidoId}/productos")
    @Transactional
    public ResponseEntity<?> editarProductoEnPedido(@PathVariable Long pedidoId,
            @RequestBody EditarPedidoDTO dto) {
        try {
            // 1. Validar pedido y estado
            Pedido pedido = pedidoService.buscarPedidoPorId(pedidoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

            if (pedido.getEstado().equalsIgnoreCase("ENTREGADO")
                    || pedido.getEstado().equalsIgnoreCase("CANCELADO")) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "No se puede editar un pedido " + pedido.getEstado())
                );
            }

            // 2. Obtener datos actuales
            List<PedidoProducto> productosActuales = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedidoId);
            List<PedidoCombo> combosActuales = pedidoComboRepo.findByPedidoId(pedidoId);

            Map<Long, Integer> cantidadesOriginalesProductos = productosActuales.stream()
                    .collect(Collectors.toMap(pp -> pp.getProducto().getId(), PedidoProducto::getCantidad));

            Map<Long, Integer> cantidadesOriginalesCombos = combosActuales.stream()
                    .collect(Collectors.toMap(pc -> pc.getCombo().getId(), PedidoCombo::getCantidad));

            Integer cantidadP1Original = pedido.getCantidadP1();
            Integer cantidadC1Original = pedido.getCantidadC1();

            // 3. Validar nuevos datos y calcular requerimientos
            Map<Long, Double> requerimientosIngredientes = new HashMap<>();
            Long nuevoTotal = 0L;

            // Procesar productos
            for (EditarPedidoDTO.ProductoCantidadDTO item : dto.getProductos()) {
                Producto producto = productoService.findById(item.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Producto no encontrado: " + item.getProductoId()));

                if (item.getCantidad() <= 0) {
                    return ResponseEntity.badRequest().body(
                            Map.of("error", "Cantidad inválida para producto: " + producto.getNombre())
                    );
                }

                int cantidadAnterior = cantidadesOriginalesProductos.getOrDefault(item.getProductoId(), 0);
                int diferencia = item.getCantidad() - cantidadAnterior;

                if (diferencia != 0) {
                    productoIngredienteService.obtenerIngredientesDeProducto(item.getProductoId())
                            .forEach(pi -> {
                                double ajuste = pi.getCantidadNecesaria() * diferencia;
                                requerimientosIngredientes.merge(
                                        pi.getIngrediente().getId(),
                                        ajuste,
                                        Double::sum
                                );
                            });
                }

                nuevoTotal += producto.getPrecio() * item.getCantidad();
            }

            // Procesar combos
            for (EditarPedidoDTO.ComboCantidadDTO comboItem : dto.getCombos()) {
                Combo combo = comboService.findById(comboItem.getComboId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Combo no encontrado: " + comboItem.getComboId()));

                if (comboItem.getCantidad() <= 0) {
                    return ResponseEntity.badRequest().body(
                            Map.of("error", "Cantidad inválida para combo: " + combo.getNombre())
                    );
                }

                int cantidadAnterior = cantidadesOriginalesCombos.getOrDefault(comboItem.getComboId(), 0);
                int diferencia = comboItem.getCantidad() - cantidadAnterior;

                if (diferencia != 0) {
                    List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(combo.getId());
                    for (ComboProducto cp : productosCombo) {
                        productoIngredienteService.obtenerIngredientesDeProducto(cp.getProducto().getId())
                                .forEach(pi -> {
                                    double ajuste = pi.getCantidadNecesaria() * cp.getCantidad() * diferencia;
                                    requerimientosIngredientes.merge(
                                            pi.getIngrediente().getId(),
                                            ajuste,
                                            Double::sum
                                    );
                                });
                    }
                }

                nuevoTotal += comboService.calcularPrecioCombo(combo.getId()) * comboItem.getCantidad();
            }

            // 3.2 Procesar desechables
            Integer nuevoP1 = dto.getCantidadP1() != null ? dto.getCantidadP1() : 0;
            Integer nuevoC1 = dto.getCantidadC1() != null ? dto.getCantidadC1() : 0;

            int diferenciaP1 = nuevoP1 - cantidadP1Original;
            int diferenciaC1 = nuevoC1 - cantidadC1Original;

            // Validar stock para desechables si hay aumento
            if (diferenciaP1 > 0 || diferenciaC1 > 0) {
                List<String> erroresDesechables = validarStockDesechables(diferenciaP1, diferenciaC1);
                if (!erroresDesechables.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(
                            Map.of(
                                    "tipo", "STOCK_INSUFICIENTE_DESECHABLES",
                                    "detalles", erroresDesechables
                            )
                    );
                }
            }

            ajustarStockDesechables(diferenciaP1, diferenciaC1);

            // 7. Actualizar pedido con nuevos desechables
            pedido.setCantidadP1(nuevoP1);
            pedido.setCantidadC1(nuevoC1);

            // 4. Validar stock solo para incrementos
            List<String> erroresStock = new ArrayList<>();
            requerimientosIngredientes.forEach((ingredienteId, ajuste) -> {
                if (ajuste > 0) {
                    Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Error en ingrediente: " + ingredienteId));

                    if (ingrediente.getCantidadActual() < ajuste) {
                        erroresStock.add(String.format("%s - Requerido: %.2f, Disponible: %.2f",
                                ingrediente.getNombre(), ajuste, ingrediente.getCantidadActual()));
                    }
                }
            });

            if (!erroresStock.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                        Map.of(
                                "tipo", "STOCK_INSUFICIENTE",
                                "detalles", erroresStock
                        )
                );
            }

            // 5. Actualizar relaciones
            actualizarProductosPedido(pedido, dto, productosActuales);
            actualizarCombosPedido(pedido, dto, combosActuales);

            // 6. Ajustar stock
            requerimientosIngredientes.forEach((ingredienteId, ajuste) -> {
                Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
                ingrediente.setCantidadActual(ingrediente.getCantidadActual() - ajuste);
                ingredienteService.save(ingrediente);
            });

            // 7. Actualizar pedido
            pedido.setDetalles(dto.getDetalles());
            pedido.setTotal(nuevoTotal);
            Pedido pedidoActualizado = pedidoService.actualizar(pedidoId, pedido)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));

            return ResponseEntity.ok(pedidoActualizado);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error procesando edición: " + e.getMessage()
            );
        }
    }

// Método para actualizar combos
    private void actualizarCombosPedido(Pedido pedido, EditarPedidoDTO dto, List<PedidoCombo> combosActuales) {
        Set<Long> nuevosIds = dto.getCombos().stream()
                .map(EditarPedidoDTO.ComboCantidadDTO::getComboId)
                .collect(Collectors.toSet());

        // Eliminar combos removidos
        combosActuales.stream()
                .filter(pc -> !nuevosIds.contains(pc.getCombo().getId()))
                .forEach(pc -> pedidoComboRepo.delete(pc));

        // Actualizar/agregar combos
        dto.getCombos().forEach(item -> {
            Optional<PedidoCombo> existente = combosActuales.stream()
                    .filter(pc -> pc.getCombo().getId().equals(item.getComboId()))
                    .findFirst();

            if (existente.isPresent()) {
                PedidoCombo pc = existente.get();
                pc.setCantidad(item.getCantidad());
                pedidoComboRepo.save(pc);
            } else {
                Combo combo = comboService.findById(item.getComboId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));

                PedidoCombo nuevoPC = new PedidoCombo();
                nuevoPC.setPedido(pedido);
                nuevoPC.setCombo(combo);
                nuevoPC.setCantidad(item.getCantidad());
                pedidoComboRepo.save(nuevoPC);
            }
        });
    }

    private void actualizarProductosPedido(Pedido pedido, EditarPedidoDTO dto, List<PedidoProducto> productosActuales) {
        Set<Long> nuevosIds = dto.getProductos().stream()
                .map(EditarPedidoDTO.ProductoCantidadDTO::getProductoId)
                .collect(Collectors.toSet());

        // Eliminar productos removidos
        productosActuales.stream()
                .filter(pp -> !nuevosIds.contains(pp.getProducto().getId()))
                .forEach(pp -> pedidoProductoService.eliminarPedidoProducto(pp.getId()));

        // Actualizar/agregar productos
        dto.getProductos().forEach(item -> {
            Optional<PedidoProducto> existente = productosActuales.stream()
                    .filter(pp -> pp.getProducto().getId().equals(item.getProductoId()))
                    .findFirst();

            if (existente.isPresent()) {
                PedidoProducto pp = existente.get();
                pp.setCantidad(item.getCantidad());
                pedidoProductoService.guardarPedidoProducto(pp);
            } else {
                Producto producto = productoService.findById(item.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));

                PedidoProducto nuevoPP = new PedidoProducto();
                nuevoPP.setPedido(pedido);
                nuevoPP.setProducto(producto);
                nuevoPP.setCantidad(item.getCantidad());
                pedidoProductoService.guardarPedidoProducto(nuevoPP);
            }
        });
    }

    // Métodos auxiliares nuevos
    private List<String> validarStockDesechables(int diferenciaP1, int diferenciaC1) {
        List<String> errores = new ArrayList<>();

        if (diferenciaP1 > 0) {
            Ingrediente p1 = ingredienteService.findByNombre("P1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente P1 no encontrado"));
            if (p1.getCantidadActual() < diferenciaP1) {
                errores.add("P1: Requerido " + diferenciaP1 + ", Disponible " + p1.getCantidadActual());
            }
        }

        if (diferenciaC1 > 0) {
            Ingrediente c1 = ingredienteService.findByNombre("C1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente C1 no encontrado"));
            if (c1.getCantidadActual() < diferenciaC1) {
                errores.add("C1: Requerido " + diferenciaC1 + ", Disponible " + c1.getCantidadActual());
            }
        }

        return errores;
    }

    private void ajustarStockDesechables(int diferenciaP1, int diferenciaC1) {
        if (diferenciaP1 != 0) {
            Ingrediente p1 = ingredienteService.findByNombre("P1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente P1 no encontrado"));
            p1.setCantidadActual(p1.getCantidadActual() - diferenciaP1);
            ingredienteService.save(p1);
        }

        if (diferenciaC1 != 0) {
            Ingrediente c1 = ingredienteService.findByNombre("C1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente C1 no encontrado"));
            c1.setCantidadActual(c1.getCantidadActual() - diferenciaC1);
            ingredienteService.save(c1);
        }
    }

}
