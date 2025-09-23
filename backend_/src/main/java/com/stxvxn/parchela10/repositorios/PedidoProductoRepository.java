package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.PedidoProducto;

/**
 * Interfaz que define el repositorio para la entidad PedidoProducto.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface PedidoProductoRepository extends CrudRepository<PedidoProducto, Long> {

    List<PedidoProducto> findByPedidoId(Long pedidoId);

    List<PedidoProducto> findByPedidoIdIn(List<Long> pedidoIds);

}
