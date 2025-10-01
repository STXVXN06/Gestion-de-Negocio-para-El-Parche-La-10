package com.stxvxn.parchela10.servicios.reportes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.dto.AdicionReporteDTO;
import com.stxvxn.parchela10.dto.DesperdicioReporteDTO;
import com.stxvxn.parchela10.dto.IngredienteUsoDTO;
import com.stxvxn.parchela10.dto.ProductoVentaDTO;
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
        // Obtener pedidos ENTREGADOS en el rango de fechas
        List<Pedido> pedidos = pedidoRepository.findByEstadoAndFechaBetween("ENTREGADO", fechaInicio, fechaFin);

        // Mapa para acumular ventas por producto
        Map<Long, ProductoVentaDTO> ventasMap = new HashMap<>();

        // Procesar productos individuales
        for (Pedido pedido : pedidos) {
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            for (PedidoProducto pp : productos) {
                Producto producto = pp.getProducto();
                Long cantidad = pp.getCantidad().longValue();

                ProductoVentaDTO dto = ventasMap.getOrDefault(producto.getId(),
                        new ProductoVentaDTO(producto.getId(), producto.getNombre(), 0L));

                dto.setCantidadVendida(dto.getCantidadVendida() + cantidad);
                ventasMap.put(producto.getId(), dto);
            }
        }

        // Procesar productos en combos
        for (Pedido pedido : pedidos) {
            List<PedidoCombo> combos = pedidoComboRepository.findByPedidoId(pedido.getId());
            for (PedidoCombo pc : combos) {
                List<ComboProducto> productosCombo = comboProductoRepository.findByComboId(pc.getCombo().getId());
                for (ComboProducto cp : productosCombo) {
                    Producto producto = cp.getProducto();
                    Long cantidad = cp.getCantidad() * pc.getCantidad().longValue();

                    ProductoVentaDTO dto = ventasMap.getOrDefault(producto.getId(),
                            new ProductoVentaDTO(producto.getId(), producto.getNombre(), 0L));

                    dto.setCantidadVendida(dto.getCantidadVendida() + cantidad);
                    ventasMap.put(producto.getId(), dto);
                }
            }
        }

        // Ordenar por cantidad descendente y limitar a TOP 10
        return ventasMap.values().stream()
                .sorted((a, b) -> b.getCantidadVendida().compareTo(a.getCantidadVendida()))
                .limit(10)
                .collect(Collectors.toList());
    }

    @Override
    public List<IngredienteUsoDTO> obtenerIngredientesUtilizados(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        // Obtener pedidos ENTREGADOS en el rango de fechas
        List<Pedido> pedidos = pedidoRepository.findByEstadoAndFechaBetween("ENTREGADO", fechaInicio, fechaFin);

        // Mapa para acumular uso de ingredientes
        Map<Long, IngredienteUsoDTO> usoMap = new HashMap<>();

        // 1. Procesar productos individuales de pedidos
        for (Pedido pedido : pedidos) {
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            for (PedidoProducto pp : productos) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                        .findByProductoId(pp.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    agregarUsoIngrediente(usoMap, pi.getIngrediente(), pi.getCantidadNecesaria() * pp.getCantidad());
                }
            }
        }

        // 2. Procesar combos de pedidos
        for (Pedido pedido : pedidos) {
            List<PedidoCombo> combos = pedidoComboRepository.findByPedidoId(pedido.getId());
            for (PedidoCombo pc : combos) {
                List<ComboProducto> productosCombo = comboProductoRepository.findByComboId(pc.getCombo().getId());
                for (ComboProducto cp : productosCombo) {
                    List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                            .findByProductoId(cp.getProducto().getId());

                    for (ProductoIngrediente pi : ingredientes) {
                        double cantidadUsada = pi.getCantidadNecesaria() * cp.getCantidad() * pc.getCantidad();
                        agregarUsoIngrediente(usoMap, pi.getIngrediente(), cantidadUsada);
                    }
                }
            }
        }

        // 3. Procesar adiciones de pedidos
        for (Pedido pedido : pedidos) {
            List<AdicionPedido> adiciones = adicionPedidoRepository.findByPedidoId(pedido.getId());
            for (AdicionPedido adicion : adiciones) {
                // Convertir Integer a Double
                agregarUsoIngrediente(usoMap, adicion.getIngrediente(), adicion.getCantidad().doubleValue());
            }
        }

        // 4. Procesar desperdicios (tanto de ingredientes como de productos)
        List<Desperdicio> desperdicios = desperdicioRepository.findByFechaBetween(fechaInicio, fechaFin);
        for (Desperdicio desperdicio : desperdicios) {
            // Desperdicio de ingrediente directo
            if (desperdicio.getIngrediente() != null && desperdicio.getCantidadIngrediente() != null) {
                agregarUsoIngrediente(usoMap, desperdicio.getIngrediente(), desperdicio.getCantidadIngrediente());
            }

            // Desperdicio de producto (sumar sus ingredientes)
            if (desperdicio.getProducto() != null && desperdicio.getCantidadProducto() != null) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                        .findByProductoId(desperdicio.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    double cantidadTotal = pi.getCantidadNecesaria() * desperdicio.getCantidadProducto();
                    agregarUsoIngrediente(usoMap, pi.getIngrediente(), cantidadTotal);
                }
            }
        }

        return new ArrayList<>(usoMap.values());
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
