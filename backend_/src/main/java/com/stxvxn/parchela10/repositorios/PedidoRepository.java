package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.Pedido;

/**
 * Repositorio para la entidad Pedido.
 */
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEstadoAndFechaBetween(String estado, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.adiciones a LEFT JOIN FETCH a.ingrediente")
    List<Pedido> findAllWithAdiciones();

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.pedidoProductos pp LEFT JOIN FETCH pp.producto")
    List<Pedido> findAllWithProductos();

    @Query("""
            SELECT p FROM Pedido p
            WHERE (:estado IS NULL OR p.estado = :estado)
            AND (:desde IS NULL OR p.fecha >= :desde)
            AND (:hasta IS NULL OR p.fecha <= :hasta)
            """)
    Page<Pedido> findResumenFiltrado(@Param("estado") String estado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            Pageable pageable);

    @Query("""
            SELECT p.estado, COUNT(p) FROM Pedido p
            WHERE (:desde IS NULL OR p.fecha >= :desde)
            AND (:hasta IS NULL OR p.fecha <= :hasta)
            GROUP BY p.estado
            """)
    List<Object[]> countPedidosPorEstado(@Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);
}
