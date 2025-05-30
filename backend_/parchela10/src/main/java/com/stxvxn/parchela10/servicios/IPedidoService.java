package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoProducto;

public interface IPedidoService {

    Optional<Pedido> crearPedido(Pedido pedido, List<PedidoProducto> pedidoProductos);
    
    Optional<Pedido> buscarPedidoPorId(Long id);

    List<Pedido> obtenerTodos();

    Optional<Pedido> cambiarEstado(Long id, String estado);

    Optional<Pedido> actualizar(Long id, Pedido pedido);
}

