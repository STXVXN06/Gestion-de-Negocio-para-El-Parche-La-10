package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.DTO.AdicionReporteDTO;
import com.stxvxn.parchela10.DTO.DesperdicioReporteDTO;
import com.stxvxn.parchela10.DTO.IngredienteUsoDTO;
import com.stxvxn.parchela10.DTO.ProductoVentaDTO;
import com.stxvxn.parchela10.entidades.AdicionPedido;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Desperdicio;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.AdicionPedidoRepository;
import com.stxvxn.parchela10.repositorios.ComboProductoRepository;
import com.stxvxn.parchela10.repositorios.DesperdicioRepository;
import com.stxvxn.parchela10.repositorios.MovimientoCajaRepository;
import com.stxvxn.parchela10.repositorios.PedidoComboRepository;
import com.stxvxn.parchela10.repositorios.PedidoProductoRepository;
import com.stxvxn.parchela10.repositorios.PedidoRepository;
import com.stxvxn.parchela10.repositorios.ProductoIngredienteRepository;

@Service
public class ReporteServiceImpl implements IReporteService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoProductoRepository pedidoProductoRepository;

    @Autowired
    private PedidoComboRepository pedidoComboRepository;

    @Autowired
    private ComboProductoRepository comboProductoRepository;

    @Autowired
    private ProductoIngredienteRepository productoIngredienteRepository;

    @Autowired
    private AdicionPedidoRepository adicionPedidoRepository;

    @Autowired
    private DesperdicioRepository desperdicioRepository;

    @Override
    public Long calcularGanancias(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Long ingresos = movimientoCajaRepository.sumIngresosByFechaBetween(fechaInicio, fechaFin);
        Long egresos = movimientoCajaRepository.sumEgresosByFechaBetween(fechaInicio, fechaFin);
        return (ingresos != null ? ingresos : 0) - (egresos != null ? egresos : 0);
    }

    @Override
    public Long calcularIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return movimientoCajaRepository.sumIngresosByFechaBetween(fechaInicio, fechaFin);
    }

    @Override
    public Long calcularEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return movimientoCajaRepository.sumEgresosByFechaBetween(fechaInicio, fechaFin);
    }

    @Override
    public List<ProductoVentaDTO> obtenerProductosMasVendidos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Pedido> pedidos = pedidoRepository.findByEstadoAndFechaBetween("ENTREGADO", fechaInicio, fechaFin);
        if (pedidos.isEmpty()) {
            return List.of();
        }

        List<Long> pedidoIds = pedidos.stream().map(Pedido::getId).toList();
        Map<Long, List<PedidoProducto>> ppPorPedido = pedidoProductoRepository.findByPedidoIdIn(pedidoIds).stream()
                .collect(Collectors.groupingBy(pp -> pp.getPedido().getId()));
        Map<Long, List<PedidoCombo>> combosPorPedido = pedidoComboRepository.findByPedidoIdIn(pedidoIds).stream()
                .collect(Collectors.groupingBy(pc -> pc.getPedido().getId()));

        Set<Long> comboIds = combosPorPedido.values().stream()
                .flatMap(List::stream)
                .map(pc -> pc.getCombo().getId())
                .collect(Collectors.toSet());
        Map<Long, List<ComboProducto>> lineasCombo = agruparComboProductosPorComboIds(comboIds);

        Map<Long, ProductoVentaDTO> ventasMap = new HashMap<>();

        for (Pedido pedido : pedidos) {
            for (PedidoProducto pp : ppPorPedido.getOrDefault(pedido.getId(), List.of())) {
                acumularVentaProducto(ventasMap, pp.getProducto(), pp.getCantidad().longValue());
            }
        }
        for (Pedido pedido : pedidos) {
            for (PedidoCombo pc : combosPorPedido.getOrDefault(pedido.getId(), List.of())) {
                for (ComboProducto cp : lineasCombo.getOrDefault(pc.getCombo().getId(), List.of())) {
                    long cantidad = cp.getCantidad() * pc.getCantidad().longValue();
                    acumularVentaProducto(ventasMap, cp.getProducto(), cantidad);
                }
            }
        }

        return ventasMap.values().stream()
                .sorted((a, b) -> b.getCantidadVendida().compareTo(a.getCantidadVendida()))
                .limit(10)
                .collect(Collectors.toList());
    }

    @Override
    public List<IngredienteUsoDTO> obtenerIngredientesUtilizados(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Pedido> pedidos = pedidoRepository.findByEstadoAndFechaBetween("ENTREGADO", fechaInicio, fechaFin);
        List<Desperdicio> desperdicios = desperdicioRepository.findByFechaBetween(fechaInicio, fechaFin);

        Map<Long, IngredienteUsoDTO> usoMap = new HashMap<>();
        Set<Long> productoIds = new HashSet<>();

        for (Desperdicio d : desperdicios) {
            if (d.getProducto() != null && d.getCantidadProducto() != null) {
                productoIds.add(d.getProducto().getId());
            }
        }

        Map<Long, List<PedidoProducto>> ppPorPedido = Map.of();
        Map<Long, List<PedidoCombo>> combosPorPedido = Map.of();
        Map<Long, List<ComboProducto>> lineasCombo = Map.of();
        List<Long> pedidoIds = List.of();

        if (!pedidos.isEmpty()) {
            pedidoIds = pedidos.stream().map(Pedido::getId).toList();
            ppPorPedido = pedidoProductoRepository.findByPedidoIdIn(pedidoIds).stream()
                    .collect(Collectors.groupingBy(pp -> pp.getPedido().getId()));
            combosPorPedido = pedidoComboRepository.findByPedidoIdIn(pedidoIds).stream()
                    .collect(Collectors.groupingBy(pc -> pc.getPedido().getId()));
            Set<Long> comboIds = combosPorPedido.values().stream()
                    .flatMap(List::stream)
                    .map(pc -> pc.getCombo().getId())
                    .collect(Collectors.toSet());
            lineasCombo = agruparComboProductosPorComboIds(comboIds);
            ppPorPedido.values().stream().flatMap(List::stream)
                    .forEach(pp -> productoIds.add(pp.getProducto().getId()));
            lineasCombo.values().stream().flatMap(List::stream)
                    .forEach(cp -> productoIds.add(cp.getProducto().getId()));
        }

        Map<Long, List<ProductoIngrediente>> ingPorProducto = cargarIngredientesPorProductoIds(productoIds);

        if (!pedidos.isEmpty()) {
            for (Pedido pedido : pedidos) {
                for (PedidoProducto pp : ppPorPedido.getOrDefault(pedido.getId(), List.of())) {
                    for (ProductoIngrediente pi : ingPorProducto.getOrDefault(pp.getProducto().getId(), List.of())) {
                        agregarUsoIngrediente(usoMap, pi.getIngrediente(), pi.getCantidadNecesaria() * pp.getCantidad());
                    }
                }
            }
            for (Pedido pedido : pedidos) {
                for (PedidoCombo pc : combosPorPedido.getOrDefault(pedido.getId(), List.of())) {
                    for (ComboProducto cp : lineasCombo.getOrDefault(pc.getCombo().getId(), List.of())) {
                        for (ProductoIngrediente pi : ingPorProducto.getOrDefault(cp.getProducto().getId(),
                                List.of())) {
                            double cantidadUsada = pi.getCantidadNecesaria() * cp.getCantidad() * pc.getCantidad();
                            agregarUsoIngrediente(usoMap, pi.getIngrediente(), cantidadUsada);
                        }
                    }
                }
            }
            List<AdicionPedido> adicionesTodas = adicionPedidoRepository.findByPedidoIdInWithIngrediente(pedidoIds);
            for (AdicionPedido adicion : adicionesTodas) {
                agregarUsoIngrediente(usoMap, adicion.getIngrediente(), adicion.getCantidad().doubleValue());
            }
        }

        for (Desperdicio desperdicio : desperdicios) {
            if (desperdicio.getIngrediente() != null && desperdicio.getCantidadIngrediente() != null) {
                agregarUsoIngrediente(usoMap, desperdicio.getIngrediente(), desperdicio.getCantidadIngrediente());
            }
            if (desperdicio.getProducto() != null && desperdicio.getCantidadProducto() != null) {
                for (ProductoIngrediente pi : ingPorProducto.getOrDefault(desperdicio.getProducto().getId(),
                        List.of())) {
                    double cantidadTotal = pi.getCantidadNecesaria() * desperdicio.getCantidadProducto();
                    agregarUsoIngrediente(usoMap, pi.getIngrediente(), cantidadTotal);
                }
            }
        }

        return new ArrayList<>(usoMap.values());
    }

    private static void acumularVentaProducto(Map<Long, ProductoVentaDTO> ventasMap, Producto producto, long cantidad) {
        ProductoVentaDTO dto = ventasMap.getOrDefault(producto.getId(),
                new ProductoVentaDTO(producto.getId(), producto.getNombre(), 0L));
        dto.setCantidadVendida(dto.getCantidadVendida() + cantidad);
        ventasMap.put(producto.getId(), dto);
    }

    private Map<Long, List<ComboProducto>> agruparComboProductosPorComboIds(Set<Long> comboIds) {
        if (comboIds == null || comboIds.isEmpty()) {
            return Map.of();
        }
        return comboProductoRepository.findByComboIds(new ArrayList<>(comboIds)).stream()
                .collect(Collectors.groupingBy(cp -> cp.getCombo().getId()));
    }

    private Map<Long, List<ProductoIngrediente>> cargarIngredientesPorProductoIds(Set<Long> productoIds) {
        if (productoIds == null || productoIds.isEmpty()) {
            return Map.of();
        }
        return productoIngredienteRepository.findByProductoIdInWithDetails(new ArrayList<>(productoIds)).stream()
                .collect(Collectors.groupingBy(pi -> pi.getProducto().getId()));
    }

    // Método auxiliar actualizado para manejar Double
    private void agregarUsoIngrediente(Map<Long, IngredienteUsoDTO> usoMap, Ingrediente ingrediente, Double cantidad) {
        IngredienteUsoDTO dto = usoMap.getOrDefault(ingrediente.getId(),
                new IngredienteUsoDTO(
                        ingrediente.getId(),
                        ingrediente.getNombre(),
                        0.0,
                        ingrediente.getUnidadMedida().getNombre()));

        dto.setCantidadUsada(dto.getCantidadUsada() + cantidad);
        usoMap.put(ingrediente.getId(), dto);
    }

    @Override
    public List<AdicionReporteDTO> obtenerAdicionesIngredientes(LocalDateTime fechaInicio, LocalDateTime fechaFin) {

        List<AdicionPedido> adiciones = adicionPedidoRepository.findByPedidoFechaBetween(fechaInicio, fechaFin);

        return adiciones.stream().map(adicion -> {
            AdicionReporteDTO dto = new AdicionReporteDTO();
            dto.setPedidoId(adicion.getPedido().getId());
            dto.setIngredienteNombre(adicion.getIngrediente().getNombre());
            dto.setCantidad(adicion.getCantidad().doubleValue());
            dto.setUnidadMedida(adicion.getIngrediente().getUnidadMedida().getSimbolo());
            dto.setFecha(adicion.getPedido().getFecha());
            dto.setAplicadoA(adicion.getAplicadoA());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<DesperdicioReporteDTO> obtenerDesperdicios(LocalDateTime fechaInicio, LocalDateTime fechaFin) {

        List<Desperdicio> desperdicios = desperdicioRepository.findByFechaBetween(fechaInicio, fechaFin);

        return desperdicios.stream().map(desperdicio -> {
            DesperdicioReporteDTO dto = new DesperdicioReporteDTO();
            dto.setId(desperdicio.getId());
            dto.setFecha(desperdicio.getFecha());
            dto.setMotivo(desperdicio.getMotivo());

            if (desperdicio.getProducto() != null) {
                dto.setTipoItem("PRODUCTO");
                dto.setNombreItem(desperdicio.getProducto().getNombre());
                dto.setCantidad(desperdicio.getCantidadProducto());
                dto.setUnidadMedida("unidades");
            } else if (desperdicio.getIngrediente() != null) {
                dto.setTipoItem("INGREDIENTE");
                dto.setNombreItem(desperdicio.getIngrediente().getNombre());
                dto.setCantidad(desperdicio.getCantidadIngrediente());
                dto.setUnidadMedida(desperdicio.getIngrediente().getUnidadMedida().getSimbolo());
            }
            return dto;
        }).collect(Collectors.toList());
    }

}
