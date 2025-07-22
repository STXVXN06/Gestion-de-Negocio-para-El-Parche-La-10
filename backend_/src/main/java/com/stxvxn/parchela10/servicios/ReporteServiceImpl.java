package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.DTO.IngredienteUsoDTO;
import com.stxvxn.parchela10.DTO.ProductoVentaDTO;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.ComboProductoRepository;
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

        // Procesar productos individuales
        for (Pedido pedido : pedidos) {
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            for (PedidoProducto pp : productos) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                        .findByProductoId(pp.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    Ingrediente ingrediente = pi.getIngrediente();
                    Double cantidadUsada = pi.getCantidadNecesaria() * pp.getCantidad();

                    IngredienteUsoDTO dto = usoMap.getOrDefault(ingrediente.getId(),
                            new IngredienteUsoDTO(
                                    ingrediente.getId(),
                                    ingrediente.getNombre(),
                                    0.0,
                                    ingrediente.getUnidadMedida().getNombre()));

                    dto.setCantidadUsada(dto.getCantidadUsada() + cantidadUsada);
                    usoMap.put(ingrediente.getId(), dto);
                }
            }
        }

        // Procesar combos
        for (Pedido pedido : pedidos) {
            List<PedidoCombo> combos = pedidoComboRepository.findByPedidoId(pedido.getId());
            for (PedidoCombo pc : combos) {
                List<ComboProducto> productosCombo = comboProductoRepository.findByComboId(pc.getCombo().getId());
                for (ComboProducto cp : productosCombo) {
                    List<ProductoIngrediente> ingredientes = productoIngredienteRepository
                            .findByProductoId(cp.getProducto().getId());

                    for (ProductoIngrediente pi : ingredientes) {
                        Ingrediente ingrediente = pi.getIngrediente();
                        Double cantidadUsada = pi.getCantidadNecesaria() * cp.getCantidad() * pc.getCantidad();

                        IngredienteUsoDTO dto = usoMap.getOrDefault(ingrediente.getId(),
                                new IngredienteUsoDTO(
                                        ingrediente.getId(),
                                        ingrediente.getNombre(),
                                        0.0,
                                        ingrediente.getUnidadMedida().getNombre()));

                        dto.setCantidadUsada(dto.getCantidadUsada() + cantidadUsada);
                        usoMap.put(ingrediente.getId(), dto);
                    }
                }
            }
        }

        return new ArrayList<>(usoMap.values());
    }

}
