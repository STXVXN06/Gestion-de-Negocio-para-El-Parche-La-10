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
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO;
import com.stxvxn.parchela10.DTO.PedidoConProductosDTO.ProductoEnPedido;
import com.stxvxn.parchela10.DTO.PedidoRequestDTO;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
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

    @PostMapping
    public ResponseEntity<?> crearPedido(@RequestBody PedidoRequestDTO pedidoDTO) {

        Pedido pedido = new Pedido();
        pedido.setEstado("PENDIENTE");
        pedido.setDetalles(
                pedidoDTO.getDetalles() != null && !pedidoDTO.getDetalles().isBlank()
                ? pedidoDTO.getDetalles()
                : "Sin detalles" // Valor por defecto
        );

        // Total
        Long total = 0L;
        List<PedidoProducto> pedidoProductos = new ArrayList<>();
        Map<Long, Double> ingredientesRequeridos = new HashMap<>();

        for (PedidoRequestDTO.ProductoCantidadDTO item : pedidoDTO.getProductos()) {
            Producto producto = productoService.findById(item.getProductoId()).orElseThrow();

            PedidoProducto pedidoProducto = new PedidoProducto();
            pedidoProducto.setProducto(producto);
            pedidoProducto.setCantidad(item.getCantidad());
            pedidoProductos.add(pedidoProducto);

            total += producto.getPrecio() * item.getCantidad();

            // Acumular ingredientes requeridos
            List<ProductoIngrediente> ingredientes = productoIngredienteService.obtenerIngredientesDeProducto(producto.getId());
            for (ProductoIngrediente pi : ingredientes) {
                Long ingredienteId = pi.getIngrediente().getId();
                double requerido = pi.getCantidadNecesaria() * item.getCantidad();
                ingredientesRequeridos.put(ingredienteId,
                        ingredientesRequeridos.getOrDefault(ingredienteId, 0.0) + requerido);
            }
        }

        // Verificar si hay suficiente stock
        List<String> erroresStock = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : ingredientesRequeridos.entrySet()) {
            Long ingredienteId = entry.getKey();
            double requerido = entry.getValue();
            Ingrediente ing = ingredienteService.findById(ingredienteId).orElseThrow();
            double disponible = ing.getCantidadActual();

            if (disponible < requerido) {
                erroresStock.add(ing.getNombre()
                        + " - Requiere: " + requerido
                        + ", Disponible: " + disponible);
            }
        }

        if (!erroresStock.isEmpty()) {
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "No hay suficiente stock para algunos ingredientes");
            respuesta.put("detalles", erroresStock);
            return ResponseEntity.badRequest().body(respuesta);
        }

        pedido.setTotal(total);
        Optional<Pedido> pedidoCreado = pedidoService.crearPedido(pedido, pedidoProductos);
        if (pedidoCreado.isPresent()) {
            return ResponseEntity.ok().body(pedidoCreado.orElseThrow());
        }
        return ResponseEntity.notFound().build();

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

        List<PedidoConProductosDTO> dtos = pedidos.stream().map(pedido -> {
            PedidoConProductosDTO dto = new PedidoConProductosDTO();
            dto.setId(pedido.getId());
            dto.setFecha(pedido.getFecha());
            dto.setEstado(pedido.getEstado());
            dto.setTotal(pedido.getTotal());
            dto.setDetalles(pedido.getDetalles());

            List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedido.getId());
            List<ProductoEnPedido> productosDTO = productos.stream()
                    .map(pp -> {
                        ProductoEnPedido p = new ProductoEnPedido();
                        p.setNombre(pp.getProducto().getNombre());
                        p.setCantidad(pp.getCantidad());
                        p.setPrecio(pp.getProducto().getPrecio());
                        return p;
                    }).toList();

            dto.setProductos(productosDTO);
            return dto;
        }).toList();

        return ResponseEntity.ok(dtos);
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
            List<PedidoProducto> productos = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedidoOptional.orElseThrow().getId());
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
            // 1. Validar pedido y su estado
            Pedido pedido = pedidoService.buscarPedidoPorId(pedidoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

            if (pedido.getEstado().equalsIgnoreCase("ENTREGADO")
                    || pedido.getEstado().equalsIgnoreCase("CANCELADO")) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "No se puede editar un pedido " + pedido.getEstado())
                );
            }

            // 2. Obtener productos actuales y mapear cantidades
            List<PedidoProducto> productosActuales = pedidoProductoService.obtenerPedidoProductosPorPedidoId(pedidoId);
            Map<Long, Integer> cantidadesOriginales = productosActuales.stream()
                    .collect(Collectors.toMap(pp -> pp.getProducto().getId(), PedidoProducto::getCantidad));

            // 3. Validar productos nuevos y calcular requerimientos
            Map<Long, Double> requerimientosIngredientes = new HashMap<>();
            Long nuevoTotal = 0L;

            for (EditarPedidoDTO.ProductoCantidadDTO item : dto.getProductos()) {
                // Validar existencia de producto
                Producto producto = productoService.findById(item.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Producto no encontrado: " + item.getProductoId()));

                // Validar cantidad positiva
                if (item.getCantidad() <= 0) {
                    return ResponseEntity.badRequest().body(
                            Map.of("error", "Cantidad inválida para el producto: " + producto.getNombre())
                    );
                }

                // Calcular diferencia
                int cantidadAnterior = cantidadesOriginales.getOrDefault(item.getProductoId(), 0);
                int diferencia = item.getCantidad() - cantidadAnterior;

                // Calcular impacto en ingredientes solo si hay cambio
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

            // 4. Validar stock solo para requerimientos positivos
            List<String> erroresStock = new ArrayList<>();
            requerimientosIngredientes.forEach((ingredienteId, requerido) -> {
                if (requerido > 0) { // Solo validar si necesitamos más stock
                    Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Error en configuración de ingredientes"));

                    if (ingrediente.getCantidadActual() < requerido) {
                        erroresStock.add(String.format("%s - Requerido: %.2f, Disponible: %.2f",
                                ingrediente.getNombre(), requerido, ingrediente.getCantidadActual()));
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

            // 5. Actualizar relaciones de productos
            actualizarProductosPedido(pedido, dto, productosActuales);

            // 6. Ajustar stock de ingredientes
            requerimientosIngredientes.forEach((ingredienteId, ajuste) -> {
                Ingrediente ingrediente = ingredienteService.findById(ingredienteId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
                ingrediente.setCantidadActual(ingrediente.getCantidadActual() - ajuste);
                ingredienteService.save(ingrediente);
            });

            // 7. Actualizar datos del pedido
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
                    "Error procesando la edición: " + e.getMessage()
            );
        }
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

}
