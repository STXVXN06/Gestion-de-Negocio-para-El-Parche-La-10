package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.MovimientoCaja;

/**
 * Interfaz que define el repositorio para la entidad MovimientoCaja.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    Optional<MovimientoCaja> findByCompraId(Long compraId);

    List<MovimientoCaja> findByTipoIgnoreCase(String tipo);

    Page<MovimientoCaja> findByTipoIgnoreCase(String tipo, Pageable pageable);

    @Query("""
            SELECT m FROM MovimientoCaja m
            WHERE (:tipo IS NULL OR LOWER(m.tipo) = LOWER(:tipo))
              AND (:inicio IS NULL OR m.fecha >= :inicio)
              AND (:fin IS NULL OR m.fecha <= :fin)
            """)
    Page<MovimientoCaja> findFiltrado(@Param("tipo") String tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCaja m WHERE m.tipo = 'INGRESO' AND m.estado = 'activo' AND m.fecha BETWEEN :inicio AND :fin")
    Long sumIngresosByFechaBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCaja m WHERE m.tipo = 'EGRESO' AND m.estado = 'activo' AND m.fecha BETWEEN :inicio AND :fin")
    Long sumEgresosByFechaBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
