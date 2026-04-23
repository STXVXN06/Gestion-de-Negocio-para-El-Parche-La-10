package com.stxvxn.parchela10.servicios;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.stxvxn.parchela10.DTO.PedidoEstadisticasDTO;
import com.stxvxn.parchela10.DTO.PedidoResumenDTO;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoCombo;
import com.stxvxn.parchela10.entidades.PedidoProducto;

public interface IPedidoService {

    Optional<Pedido> crearPedido(Pedido pedido, List<PedidoProducto> pedidoProductos,
             List<PedidoCombo> pedidoCombos);

    Optional<Pedido> buscarPedidoPorId(Long id);

    List<Pedido> obtenerTodos();

    Optional<Pedido> cambiarEstado(Long id, String estado, String metodoPago);

    Optional<Pedido> actualizar(Long id, Pedido pedido);

    Map<String, Object> calcularIngredientesCancelacion(Long id);

    Page<PedidoResumenDTO> listarPedidosResumen(String estado, LocalDate desde, LocalDate hasta, Pageable pageable);

    PedidoEstadisticasDTO estadisticasPedidos(LocalDate desde, LocalDate hasta);

    /** Resumen alineado con el listado paginado (p. ej. notificación WebSocket). */
    PedidoResumenDTO resumenDesdePedido(Pedido pedido);
}
