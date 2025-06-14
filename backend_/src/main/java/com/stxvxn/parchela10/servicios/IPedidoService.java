package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

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
}
