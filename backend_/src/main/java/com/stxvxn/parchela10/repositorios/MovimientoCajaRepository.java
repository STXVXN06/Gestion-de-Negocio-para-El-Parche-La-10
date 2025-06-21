package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.MovimientoCaja;

/**
 * Interfaz que define el repositorio para la entidad MovimientoCaja.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface MovimientoCajaRepository extends CrudRepository<MovimientoCaja, Long> {

    Optional<MovimientoCaja> findByCompraId(Long compraId);

    List<MovimientoCaja> findByTipoIgnoreCase(String tipo);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCaja m WHERE m.tipo = 'INGRESO' AND m.estado = 'activo' AND m.fecha BETWEEN :inicio AND :fin")
    Long sumIngresosByFechaBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCaja m WHERE m.tipo = 'EGRESO' AND m.estado = 'activo' AND m.fecha BETWEEN :inicio AND :fin")
    Long sumEgresosByFechaBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
