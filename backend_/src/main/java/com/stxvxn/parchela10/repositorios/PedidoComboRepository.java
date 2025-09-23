package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.PedidoCombo;

public interface PedidoComboRepository extends CrudRepository<PedidoCombo, Long> {

    List<PedidoCombo> findByPedidoId(Long pedidoId);

    List<PedidoCombo> findByPedidoIdIn(List<Long> pedidoIds);

}
