package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.Pedido;

/**
 * Interfaz que define el repositorio para la entidad Pedido.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface PedidoRepository extends CrudRepository<Pedido, Long> {

    List<Pedido> findByEstadoAndFechaBetween(String estado, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.adiciones a LEFT JOIN FETCH a.ingrediente")
    List<Pedido> findAllWithAdiciones();

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.pedidoProductos pp LEFT JOIN FETCH pp.producto")
    List<Pedido> findAllWithProductos();

}
