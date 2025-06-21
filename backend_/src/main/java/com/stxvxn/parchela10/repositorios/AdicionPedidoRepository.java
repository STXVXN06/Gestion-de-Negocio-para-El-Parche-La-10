package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.AdicionPedido;

public interface AdicionPedidoRepository extends CrudRepository<AdicionPedido, Long> {
    List<AdicionPedido> findByPedidoId(Long pedidoId);

    @Query("SELECT a FROM AdicionPedido a JOIN FETCH a.ingrediente WHERE a.pedido.id = :pedidoId")
    List<AdicionPedido> findByPedidoIdWithIngrediente(@Param("pedidoId") Long pedidoId);
}
