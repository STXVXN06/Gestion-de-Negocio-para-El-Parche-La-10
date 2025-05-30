package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.PedidoProducto;

public interface IPedidoProductoService {
    List<PedidoProducto> obtenerPedidoProductosPorPedidoId(Long pedidoId);
    
    PedidoProducto guardarPedidoProducto(PedidoProducto pedidoProducto);

    Optional<PedidoProducto> eliminarPedidoProducto(Long id);
}
