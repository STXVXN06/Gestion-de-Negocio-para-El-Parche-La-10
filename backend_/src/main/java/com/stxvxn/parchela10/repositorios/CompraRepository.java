package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Interfaz que define el repositorio para la entidad Compra.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface CompraRepository extends JpaRepository<Compra, Long> {

    @Query("""
            SELECT c FROM Compra c
            WHERE (:soloAnuladas IS NULL
                    OR (:soloAnuladas = TRUE AND c.estado = 'ANULADA')
                    OR (:soloAnuladas = FALSE AND (c.estado IS NULL OR c.estado <> 'ANULADA')))
              AND (:inicio IS NULL OR c.fecha >= :inicio)
              AND (:fin IS NULL OR c.fecha <= :fin)
            """)
    Page<Compra> findFiltrado(@Param("soloAnuladas") Boolean soloAnuladas,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            Pageable pageable);
}
