package com.stxvxn.parchela10.controladores;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
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

import com.stxvxn.parchela10.DTO.AdicionRequestDTO;
import com.stxvxn.parchela10.DTO.AdicionResponseDTO;
import com.stxvxn.parchela10.DTO.EditarPedidoDTO;
import com.stxvxn.parchela10.DTO.PedidoComboDTO;
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO;
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO.ProductoEnPedido;
import com.stxvxn.parchela10.DTO.PedidoRequestDTO;
import com.stxvxn.parchela10.entidades.AdicionPedido;
import com.stxvxn.parchela10.entidades.Combo;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.AdicionPedidoRepository;
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

    @Autowired
    private AdicionPedidoRepository adicionPedidoRepository;

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
        Map<Long, Double> totalRequerimientos = new HashMap<>();

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
            acumularIngredientes(producto, item.getCantidad(), totalRequerimientos);
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
                        Map.of("error", "El combo con ID " + comboItem.getComboId() + " no está disponible"));
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
            acumularIngredientesCombo(combo, comboItem.getCantidad(), totalRequerimientos);
        }

        if (!combosErrors.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Errores en combos solicitados");
            response.put("detalles", combosErrors);
            return ResponseEntity.badRequest().body(response);
        }

        // 3. Procesar adiciones
        List<AdicionPedido> adiciones = new ArrayList<>();

        for (AdicionRequestDTO adicionDTO : pedidoDTO.getAdiciones()) {
            Ingrediente ingrediente = ingredienteService.findById(adicionDTO.getIngredienteId())
                    .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));

            // Validar que sea adicionable
            if (!ingrediente.isAdicionable()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "El ingrediente " + ingrediente.getNombre() + " no es adicionable"));
            }

            // Acumular para validación de stock
            totalRequerimientos.merge(
                    adicionDTO.getIngredienteId(),
                    (double) adicionDTO.getCantidad(),
                    Double::sum);

            // Crear entidad
            AdicionPedido adicion = new AdicionPedido();
            adicion.setIngrediente(ingrediente);
            adicion.setCantidad(adicionDTO.getCantidad());
            adicion.setAplicadoA(adicionDTO.getAplicadoA());
            adiciones.add(adicion);
        }

        // Validación de stock (unificada para productos - combos - adiciones)
        List<String> erroresStock = validarStock(totalRequerimientos);
        if (!erroresStock.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "mensaje", "Stock insuficiente",
                    "detalles", erroresStock));
        }

        pedido.setDomicilio(pedidoDTO.isDomicilio());
        if (pedido.isDomicilio() && pedidoDTO.getCostoDomicilio() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El costo de domicilio es obligatorio cuando se solicita domicilio"));

        }
        if (pedido.isDomicilio()) {
            pedido.setCostoDomicilio(pedidoDTO.getCostoDomicilio() != null
                    ? pedidoDTO.getCostoDomicilio()
                    : 2000L); // Valor por defecto si no se especifica
        } else {
            pedido.setCostoDomicilio(0L); // Si no es domicilio, el costo es 0
        }

        total += pedido.getCostoDomicilio();

        long costoAdiciones = adiciones.stream()
                .mapToLong(a -> a.getIngrediente().getPrecioAdicion() * a.getCantidad())
                .sum();
        total += costoAdiciones;

        pedido.setTotal(total);
        pedido.setAdiciones(adiciones);

        Optional<Pedido> pedidoCreado = pedidoService.crearPedido(pedido, pedidoProductos, pedidoCombos);
        if (pedidoCreado.isPresent()) {
            return ResponseEntity.ok().body(pedidoCreado.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    // --- Métodos auxiliares ---
    private void acumularIngredientes(Producto producto, Integer cantidad, Map<Long, Double> ingredientesRequeridos) {
        List<ProductoIngrediente> ingredientes = productoIngredienteService
                .obtenerIngredientesDeProducto(producto.getId());
        for (ProductoIngrediente pi : ingredientes) {
            Long ingredienteId = pi.getIngrediente().getId();
            double requerido = pi.getCantidadNecesaria() * cantidad;
            ingredientesRequeridos.merge(ingredienteId, requerido, Double::sum);
        }
    }

    private void acumularIngredientesCombo(Combo combo, Integer cantidadCombo,
            Map<Long, Double> ingredientesRequeridos) {
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
                        ing.getNombre(), entry.getValue(), ing.getCantidadActual(),
                        ing.getUnidadMedida().getSimbolo()));
            }
        }
        return errores;
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Pedido> cambiarEstado(@PathVariable Long id,
            @RequestParam String estado,
            @RequestParam(required = false) String metodoPago) {

        if ("ENTREGADO".equalsIgnoreCase(estado) && (metodoPago == null || metodoPago.isBlank())) {
            return ResponseEntity.badRequest().body(null);
        }
        Optional<Pedido> pedidoOptional = pedidoService.cambiarEstado(id, estado, metodoPago);

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
            dto.setDomicilio(pedido.isDomicilio());
            dto.setCostoDomicilio(pedido.getCostoDomicilio());
            dto.setMetodoPago(pedido.getMetodoPago());

            // Productos individuales
            List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedido.getId());
            dto.setProductos(mapearProductos(productos));

            // Combos
            List<PedidoCombo> combos = pedidoComboRepo.findByPedidoId(pedido.getId());
            dto.setCombos(mapearCombos(combos));

            // Adiciones
            List<AdicionPedido> adiciones = adicionPedidoRepository.findByPedidoIdWithIngrediente(pedido.getId());
            dto.setAdiciones(mapearAdiciones(adiciones));
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

    private List<AdicionResponseDTO> mapearAdiciones(List<AdicionPedido> adiciones) {
        return adiciones.stream().map(a -> {
            AdicionResponseDTO dto = new AdicionResponseDTO();
            dto.setId(a.getId());
            dto.setIngredienteId(a.getIngrediente().getId());
            dto.setNombreIngrediente(a.getIngrediente().getNombre());
            dto.setCantidad(a.getCantidad());
            dto.setPrecioAdicion(a.getIngrediente().getPrecioAdicion());
            dto.setSubtotal(a.getIngrediente().getPrecioAdicion() * a.getCantidad());
            dto.setAplicadoA(a.getAplicadoA());
            return dto;
        }).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoConProductosDTO> obtenerPedidoPorId(@PathVariable Long id) {
        Optional<Pedido> pedidoOptional = pedidoService.buscarPedidoPorId(id);
        if (pedidoOptional.isPresent()) {
            Pedido pedido = pedidoOptional.orElseThrow();
            PedidoConProductosDTO dto = new PedidoConProductosDTO();
            dto.setId(pedido.getId());
            dto.setFecha(pedido.getFecha());
            dto.setEstado(pedido.getEstado());
            dto.setTotal(pedido.getTotal());
            dto.setDetalles(pedido.getDetalles());
            dto.setCantidadP1(pedido.getCantidadP1());
            dto.setCantidadC1(pedido.getCantidadC1());
            dto.setDomicilio(pedido.isDomicilio());
            dto.setCostoDomicilio(pedido.getCostoDomicilio());
            dto.setMetodoPago(pedido.getMetodoPago());

            List<PedidoProducto> productos = pedidoProductoService
                    .obtenerPedidoProductosPorPedidoId(pedido.getId());
            List<PedidoCombo> combos = pedidoComboRepo.findByPedidoId(pedido.getId());
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
            List<AdicionPedido> adiciones = adicionPedidoRepository.findByPedidoIdWithIngrediente(pedido.getId());
            dto.setAdiciones(mapearAdiciones(adiciones));

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
            dto.setCantidadP1(pedido.getCantidadP1());
            dto.setCantidadC1(pedido.getCantidadC1());
            dto.setDomicilio(pedido.isDomicilio());
            dto.setCostoDomicilio(pedido.getCostoDomicilio());
            dto.setMetodoPago(pedido.getMetodoPago());

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
                        Map.of("error", "No se puede editar un pedido " + pedido.getEstado()));
            }

            // 2. Obtener datos actuales
            List<PedidoProducto> productosActuales = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedidoId);
            List<PedidoCombo> combosActuales = pedidoComboRepo.findByPedidoId(pedidoId);

            Map<Long, Integer> cantidadesOriginalesProductos = productosActuales.stream()
                    .collect(Collectors.toMap(pp -> pp.getProducto().getId(), PedidoProducto::getCantidad));

            Map<Long, Integer> cantidadesOriginalesCombos = combosActuales.stream()
                    .collect(Collectors.toMap(pc -> pc.getCombo().getId(), PedidoCombo::getCantidad));

            Integer cantidadP1Original = pedido.getCantidadP1() != null ? pedido.getCantidadP1() : 0;
            Integer cantidadC1Original = pedido.getCantidadC1() != null ? pedido.getCantidadC1() : 0;

            // 3. Validar nuevos datos y calcular requerimientos
            Map<Long, Double> requerimientosIngredientes = new HashMap<>();
            Long nuevoTotal = 0L;

            // Identificar productos eliminados
            Set<Long> productosEliminados = new HashSet<>(cantidadesOriginalesProductos.keySet());
            dto.getProductos().forEach(item -> productosEliminados.remove(item.getProductoId()));

            // Identificar combos eliminados
            Set<Long> combosEliminados = new HashSet<>(cantidadesOriginalesCombos.keySet());
            dto.getCombos().forEach(item -> combosEliminados.remove(item.getComboId()));

            // Procesar productos eliminados
            for (Long productoId : productosEliminados) {
                int cantidadOriginal = cantidadesOriginalesProductos.get(productoId);
                acumularDiferenciaIngredientes(productoId, -cantidadOriginal, requerimientosIngredientes);
            }

            // Procesar combos eliminados
            for (Long comboId : combosEliminados) {
                int cantidadOriginal = cantidadesOriginalesCombos.get(comboId);

                List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(comboId);
                for (ComboProducto cp : productosCombo) {
                    List<ProductoIngrediente> ingredientes = productoIngredienteService
                            .obtenerIngredientesDeProducto(cp.getProducto().getId());
                    for (ProductoIngrediente pi : ingredientes) {
                        double cantidadDevuelta = pi.getCantidadNecesaria() * cp.getCantidad() * cantidadOriginal;
                        requerimientosIngredientes.merge(
                                pi.getIngrediente().getId(),
                                -cantidadDevuelta,
                                Double::sum);
                    }
                }
            }

            // Procesar productos
            for (EditarPedidoDTO.ProductoCantidadDTO item : dto.getProductos()) {
                Producto producto = productoService.findById(item.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Producto no encontrado: " + item.getProductoId()));

                if (item.getCantidad() <= 0) {
                    return ResponseEntity.badRequest().body(
                            Map.of("error", "Cantidad inválida para producto: " + producto.getNombre()));
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
                                        Double::sum);
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
                            Map.of("error", "Cantidad inválida para combo: " + combo.getNombre()));
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
                                            Double::sum);
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

            // Lista unificada para errores de stock
            List<String> erroresStock = new ArrayList<>();

            // Validar stock para desechables
            if (diferenciaP1 > 0 || diferenciaC1 > 0) {
                List<String> erroresDesechables = validarStockDesechables(diferenciaP1, diferenciaC1);
                erroresStock.addAll(erroresDesechables);
            }

            // 7. Actualizar pedido con nuevos desechables
            pedido.setCantidadP1(nuevoP1);
            pedido.setCantidadC1(nuevoC1);

            pedido.setDomicilio(dto.isDomicilio());
            Long nuevoCostoDomicilio = dto.getCostoDomicilio() != null ? dto.getCostoDomicilio() : 0L;
            pedido.setCostoDomicilio(nuevoCostoDomicilio);
            nuevoTotal += (long) ((nuevoP1 + nuevoC1) * 500);

            if (dto.isDomicilio()) {
                if (nuevoCostoDomicilio == 0L) {
                    nuevoCostoDomicilio = 2000L; // Valor por defecto si no se especifica
                    pedido.setCostoDomicilio(nuevoCostoDomicilio);
                }
                nuevoTotal += nuevoCostoDomicilio;
            }

            // Validar stock de productos y combos
            requerimientosIngredientes.forEach((ingredienteId, ajuste) -> {
                if (ajuste > 0) {
                    Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                    "Error en ingrediente: " + ingredienteId));
                    if (ingrediente.getCantidadActual() < ajuste) {
                        erroresStock.add(String.format(
                                "Producto/Combo: %s - Requerido: %.2f, Disponible: %.2f",
                                ingrediente.getNombre(),
                                ajuste,
                                ingrediente.getCantidadActual()));
                    }
                }
            });

            // Validar stock de adiciones (solo validación, no modificar pedido aún)
            List<AdicionPedido> adicionesActuales = adicionPedidoRepository
                    .findByPedidoIdWithIngrediente(pedido.getId());
            pedidoService.actualizarAdiciones(pedido, dto.getAdiciones(), adicionesActuales, erroresStock);

            // Si hay errores, devolverlos todos juntos y NO modificar nada
            if (!erroresStock.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("tipo", "STOCK_INSUFICIENTE");
                response.put("detalles", erroresStock);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Si no hay errores, ahora sí modificar stock y pedido

            ajustarStockDesechables(diferenciaP1, diferenciaC1);

            // 5. Actualizar relaciones
            actualizarProductosPedido(pedido, dto, productosActuales);
            actualizarCombosPedido(pedido, dto, combosActuales);

            // 6. Ajustar stock de ingredientes
            requerimientosIngredientes.forEach((ingredienteId, ajuste) -> {
                Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
                ingrediente.setCantidadActual(ingrediente.getCantidadActual() - ajuste);
                ingredienteService.save(ingrediente);
            });

            // Procesar adiciones (ahora sí modificar pedido)
            pedido = pedidoService.actualizarAdiciones(pedido, dto.getAdiciones(), adicionesActuales, null)
                    .orElseThrow();

            // Recalcular total incluyendo adiciones
            long totalAdiciones = pedido.getAdiciones().stream()
                    .mapToLong(a -> a.getIngrediente().getPrecioAdicion() * a.getCantidad())
                    .sum();

            nuevoTotal += totalAdiciones;

            // 7. Actualizar pedido
            pedido.setDetalles(dto.getDetalles());
            pedido.setTotal(nuevoTotal);
            Pedido pedidoActualizado = pedidoService.actualizar(pedidoId, pedido)
                    .orElseThrow();

            return ResponseEntity.ok(pedidoActualizado);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace(); // Esto imprime el error real en la consola/log
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error procesando edición: " + e.getMessage());
        }
    }

    private void acumularDiferenciaIngredientes(Long productoId, int diferencia,
            Map<Long, Double> requerimientosIngredientes) {

        List<ProductoIngrediente> ingredientes = productoIngredienteService
                .obtenerIngredientesDeProducto(productoId);

        for (ProductoIngrediente pi : ingredientes) {
            Long ingredienteId = pi.getIngrediente().getId();
            double ajuste = pi.getCantidadNecesaria() * diferencia;
            requerimientosIngredientes.merge(ingredienteId, ajuste, Double::sum);
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
