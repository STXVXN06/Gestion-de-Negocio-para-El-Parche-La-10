package com.stxvxn.parchela10.servicios;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.DTO.EditarPedidoDTO;
import com.stxvxn.parchela10.DTO.PedidoComboDTO;
import com.stxvxn.parchela10.DTO.PedidoRequestDTO;
import com.stxvxn.parchela10.entidades.AdicionPedido;
import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.MovimientoCaja;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.AdicionPedidoRepository;
import com.stxvxn.parchela10.repositorios.ComboProductoRepository;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;
import com.stxvxn.parchela10.repositorios.MovimientoCajaRepository;
import com.stxvxn.parchela10.repositorios.PedidoComboRepository;
import com.stxvxn.parchela10.repositorios.PedidoProductoRepository;
import com.stxvxn.parchela10.repositorios.PedidoRepository;
import com.stxvxn.parchela10.repositorios.ProductoIngredienteRepository;

/**
 * Implementación del servicio para la entidad Pedido. Proporciona métodos para
 * crear, buscar y cambiar el estado de los pedidos.
 */
@Service
public class PedidoServiceImpl implements IPedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoProductoRepository pedidoProductoRepository;

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Autowired
    private ProductoIngredienteRepository productoIngredienteRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private AdicionPedidoRepository adicionPedidoRepository;

    @Autowired
    private CajaServiceImpl cajaService;

    @Autowired
    private PedidoComboRepository pedidoComboRepo;

    @Autowired
    private ComboProductoRepository comboProductoRepo;

    @Autowired
    private ProductoServiceImpl productoService;

    @Autowired
    private ComboServiceImpl comboService;

    @Transactional
    @Override
    public Optional<Pedido> crearPedido(Pedido pedido, List<PedidoProducto> pedidoProductos,
            List<PedidoCombo> pedidoCombos) {
        // 1. Verificar stock de desechables
        if (pedido.getCantidadP1() > 0) {
            Ingrediente p1 = ingredienteRepository.findByNombre("P1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente P1 no encontrado"));

            if (p1.getCantidadActual() < pedido.getCantidadP1()) {
                throw new RuntimeException("Stock insuficiente de P1. Disponible: " + p1.getCantidadActual());
            }
        }

        if (pedido.getCantidadC1() > 0) {
            Ingrediente c1 = ingredienteRepository.findByNombre("C1")
                    .orElseThrow(() -> new RuntimeException("Ingrediente C1 no encontrado"));

            if (c1.getCantidadActual() < pedido.getCantidadC1()) {
                throw new RuntimeException("Stock insuficiente de C1. Disponible: " + c1.getCantidadActual());
            }
        }

        pedido.setEstado("PENDIENTE");
        long totalDesechables = 0;
        if (pedido.getCantidadP1() != null) {
            totalDesechables += 500 * pedido.getCantidadP1();
        }
        if (pedido.getCantidadC1() != null) {
            totalDesechables += 500 * pedido.getCantidadC1();
        }
        pedido.setTotal(pedido.getTotal() + totalDesechables);

        // Asignar el pedido a cada adicion
        for (AdicionPedido adicion : pedido.getAdiciones()) {
            adicion.setPedido(pedido);
        }

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        if (pedidoGuardado.getCantidadP1() > 0) {
            Ingrediente p1 = ingredienteRepository.findByNombre("P1").orElseThrow();
            p1.setCantidadActual(p1.getCantidadActual() - pedidoGuardado.getCantidadP1());
            ingredienteRepository.save(p1);
        }

        if (pedidoGuardado.getCantidadC1() > 0) {
            Ingrediente c1 = ingredienteRepository.findByNombre("C1").orElseThrow();
            c1.setCantidadActual(c1.getCantidadActual() - pedidoGuardado.getCantidadC1());
            ingredienteRepository.save(c1);
        }
        for (PedidoProducto pedidoProducto : pedidoProductos) {
            pedidoProducto.setPedido(pedidoGuardado);
            pedidoProductoRepository.save(pedidoProducto);
        }

        // Restar el stock de los ingredientes
        List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedidoGuardado.getId());
        for (PedidoProducto pp : productos) {
            List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                    .findByProductoId(pp.getProducto().getId());

            for (ProductoIngrediente pi : ingredientes) {
                Ingrediente ing = pi.getIngrediente();
                double cantidadUsada = pi.getCantidadNecesaria() * pp.getCantidad();
                ing.setCantidadActual(ing.getCantidadActual() - cantidadUsada);
                ingredienteRepository.save(ing);
            }
        }

        for (PedidoCombo pc : pedidoCombos) {
            pc.setPedido(pedidoGuardado);
            pedidoComboRepo.save(pc);

            // Restar ingredientes de los combos
            List<ComboProducto> comboItems = comboProductoRepo.findByComboId(pc.getCombo().getId());
            for (ComboProducto cp : comboItems) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                        .findByProductoId(cp.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    double cantidadUsada = pi.getCantidadNecesaria() * cp.getCantidad() * pc.getCantidad();
                    Ingrediente ing = pi.getIngrediente();
                    ing.setCantidadActual(ing.getCantidadActual() - cantidadUsada);
                    ingredienteRepository.save(ing);
                }
            }
        }

        // Restar ingredientes de las adiciones
        for (AdicionPedido adicion : pedido.getAdiciones()) {
            Ingrediente ing = adicion.getIngrediente();
            double cantidadUsada = adicion.getCantidad();
            ing.setCantidadActual(ing.getCantidadActual() - cantidadUsada);
            ingredienteRepository.save(ing);
        }
        return Optional.of(pedidoGuardado);
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<Pedido> buscarPedidoPorId(Long id) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            // Forzar la carga de los productos asociados al pedido
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            productos.size();
        }
        return pedidoOpt;
    }

    @Transactional(readOnly = true)
    @Override
    public List<Pedido> obtenerTodos() {
        List<Pedido> pedidos = (List<Pedido>) pedidoRepository.findAll();
        // Forzar carga de productos para cada pedido
        pedidos.forEach(pedido -> {
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            productos.size(); // Activa la carga perezosa
        });
        return pedidos;
    }

    @Transactional
    @Override
    public Optional<Pedido> cambiarEstado(Long id, String estado, String metodoPago) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);

        if (pedidoOpt.isEmpty()) {
            return Optional.empty();
        }

        Pedido pedido = pedidoOpt.orElseThrow();
        pedido.setEstado(estado);

        if ("ENTREGADO".equalsIgnoreCase(estado)) {
            pedido.setMetodoPago(metodoPago); // Asignar método
        }
        pedidoRepository.save(pedido);

        // Si el estado es "CANCELADO", se debe devolver el stock de los ingredientes
        if (estado.equalsIgnoreCase("CANCELADO")) {

            if (!"ENTREGADO".equalsIgnoreCase(pedido.getEstado())) {
                List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
                for (PedidoProducto pp : productos) {
                    List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                            .findByProductoId(pp.getProducto().getId());

                    for (ProductoIngrediente pi : ingredientes) {
                        Ingrediente ing = pi.getIngrediente();
                        double cantidadUsada = pi.getCantidadNecesaria() * pp.getCantidad();
                        ing.setCantidadActual(ing.getCantidadActual() + cantidadUsada);
                        ingredienteRepository.save(ing);
                    }

                }

                // 2. Devolver ingredientes de combos (CORRECCIÓN CLAVE)
                List<PedidoCombo> combosDelPedido = pedidoComboRepo.findByPedidoId(pedido.getId());
                for (PedidoCombo pc : combosDelPedido) {
                    // Obtener los productos que componen este combo
                    List<ComboProducto> productosDelCombo = comboProductoRepo.findByComboId(pc.getCombo().getId());

                    for (ComboProducto cp : productosDelCombo) {
                        // Obtener los ingredientes de cada producto del combo
                        List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                                .findByProductoId(cp.getProducto().getId());

                        for (ProductoIngrediente pi : ingredientes) {
                            Ingrediente ing = pi.getIngrediente();
                            // Cálculo: (cantidad por ingrediente) x (cantidad en combo) x (cantidad de
                            // combos pedidos)
                            double cantidadUsada = pi.getCantidadNecesaria() * cp.getCantidad() * pc.getCantidad();
                            ing.setCantidadActual(ing.getCantidadActual() + cantidadUsada);
                            ingredienteRepository.save(ing);
                        }
                    }
                }

                List<AdicionPedido> adiciones = adicionPedidoRepository.findByPedidoIdWithIngrediente(pedido.getId());
                for (AdicionPedido adicion : adiciones) {
                    Ingrediente ing = adicion.getIngrediente();
                    double cantidadDevuelta = adicion.getCantidad();
                    ing.setCantidadActual(ing.getCantidadActual() + cantidadDevuelta);
                    ingredienteRepository.save(ing);
                }

                // Devolver stock de desechables P1 y C1
                if (pedido.getCantidadP1() != null && pedido.getCantidadP1() > 0) {
                    Ingrediente p1 = ingredienteRepository.findByNombre("P1")
                            .orElseThrow(() -> new RuntimeException("Ingrediente P1 no encontrado"));
                    p1.setCantidadActual(p1.getCantidadActual() + pedido.getCantidadP1());
                    ingredienteRepository.save(p1);
                }
                if (pedido.getCantidadC1() != null && pedido.getCantidadC1() > 0) {
                    Ingrediente c1 = ingredienteRepository.findByNombre("C1")
                            .orElseThrow(() -> new RuntimeException("Ingrediente C1 no encontrado"));
                    c1.setCantidadActual(c1.getCantidadActual() + pedido.getCantidadC1());
                    ingredienteRepository.save(c1);
                }

            }
        }

        // Si el estado es "ENTREGADO", registrar el movimiento de caja
        if (estado.equalsIgnoreCase("ENTREGADO")) {
            Optional<Caja> cajaOptional = cajaService.obtenerCajaActual();

            // Registrar ingreso en caja
            MovimientoCaja ingreso = new MovimientoCaja();
            ingreso.setTipo("INGRESO");
            ingreso.setDescripcion("Pedido #" + pedido.getId() + " ENTREGADO");
            ingreso.setMonto(pedido.getTotal());
            ingreso.setFecha(pedido.getFecha());
            ingreso.setCaja(cajaOptional.orElseThrow());
            ingreso.setPedido(pedido);
            ingreso.setCompra(null);
            movimientoCajaRepository.save(ingreso);
            cajaService.ajustarMontoActual(pedido.getTotal());

        }

        return Optional.of(pedido);

    }

    @Override
    public Optional<Pedido> actualizar(Long id, Pedido pedido) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedidoExistente = pedidoOpt.orElseThrow();
            pedidoExistente.setFecha(pedido.getFecha());
            pedidoExistente.setEstado(pedido.getEstado());
            pedidoExistente.setTotal(pedido.getTotal());
            pedidoExistente.setDetalles(pedido.getDetalles());
            pedidoExistente.setCantidadP1(pedido.getCantidadP1());
            pedidoExistente.setCantidadC1(pedido.getCantidadC1());
            pedidoExistente.setCostoDomicilio(pedido.getCostoDomicilio());
            pedidoExistente.setDomicilio(pedido.isDomicilio());
            return Optional.of(pedidoRepository.save(pedidoExistente));
        }
        return Optional.empty();
    }

    public Optional<Pedido> actualizarAdiciones(
            Pedido pedido,
            List<EditarPedidoDTO.AdicionEditDTO> nuevasAdiciones,
            List<AdicionPedido> adicionesActuales,
            List<String> erroresStock) {

        // 1. Agrupar nuevas adiciones por ingrediente
        Map<Long, AdicionPedido> nuevasAdicionesMap = new HashMap<>();
        for (EditarPedidoDTO.AdicionEditDTO adicionDTO : nuevasAdiciones) {
            Long ingredienteId = adicionDTO.getIngredienteId();
            Ingrediente ingrediente = ingredienteRepository.findById(ingredienteId).orElse(null);

            if (ingrediente == null)
                continue;

            AdicionPedido existente = nuevasAdicionesMap.get(ingredienteId);
            if (existente == null) {
                AdicionPedido nueva = new AdicionPedido();
                nueva.setIngrediente(ingrediente);
                nueva.setCantidad(adicionDTO.getCantidad());
                nueva.setAplicadoA(adicionDTO.getAplicadoA());
                nueva.setPedido(pedido);
                nuevasAdicionesMap.put(ingredienteId, nueva);
            } else {
                existente.setCantidad(existente.getCantidad() + adicionDTO.getCantidad());
            }
        }

        // 2. Calcular totales actuales por ingrediente
        Map<Long, Double> totalActual = adicionesActuales.stream()
                .filter(a -> a.getIngrediente() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getIngrediente().getId(),
                        Collectors.summingDouble(AdicionPedido::getCantidad)));

        // 3. Calcular totales nuevos por ingrediente
        Map<Long, Double> totalNuevo = nuevasAdicionesMap.values().stream()
                .collect(Collectors.groupingBy(
                        a -> a.getIngrediente().getId(),
                        Collectors.summingDouble(AdicionPedido::getCantidad)));

        // 4. Calcular diferencias de stock
        Set<Long> todosIngredientes = new HashSet<>();
        todosIngredientes.addAll(totalActual.keySet());
        todosIngredientes.addAll(totalNuevo.keySet());

        Map<Long, Double> ajustesStock = todosIngredientes.stream()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> totalActual.getOrDefault(id, 0.0) - totalNuevo.getOrDefault(id, 0.0)));

        // 5. Validar stock
        if (erroresStock != null) {
            for (Long idIng : todosIngredientes) {
                Ingrediente ing = ingredienteRepository.findById(idIng).orElse(null);
                if (ing == null)
                    continue;

                double ajuste = ajustesStock.get(idIng);
                if (ing.getCantidadActual() + ajuste < 0) {
                    erroresStock.add("Adición: " + ing.getNombre() + " - Requerido: " + Math.abs(ajuste)
                            + ", Disponible: " + ing.getCantidadActual());
                }
            }
            if (!erroresStock.isEmpty()) {
                return Optional.of(pedido);
            }
        }

        // 6. Aplicar ajustes de stock
        for (Long idIng : todosIngredientes) {
            Ingrediente ing = ingredienteRepository.findById(idIng).orElse(null);
            if (ing == null)
                continue;

            ing.setCantidadActual(ing.getCantidadActual() + ajustesStock.get(idIng));
            ingredienteRepository.save(ing);
        }

        // 7. Actualizar estructura del pedido
        adicionPedidoRepository.deleteAll(adicionesActuales); // Eliminar antiguas

        List<AdicionPedido> adicionesFinales = new ArrayList<>(nuevasAdicionesMap.values());
        pedido.setAdiciones(adicionesFinales);

        return Optional.of(pedido);
    }

}
