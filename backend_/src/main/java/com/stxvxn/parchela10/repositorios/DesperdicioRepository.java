package com.stxvxn.parchela10.repositorios;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.stxvxn.parchela10.entidades.Desperdicio;

/**
 * Interfaz que define el repositorio para la entidad Desperdicio.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface DesperdicioRepository extends JpaRepository<Desperdicio, Long> {

    List<Desperdicio> findByFechaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    @Query("""
            SELECT d FROM Desperdicio d
            WHERE (:inicio IS NULL OR d.fecha >= :inicio)
              AND (:fin IS NULL OR d.fecha <= :fin)
            """)
    Page<Desperdicio> findFiltrado(@Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            Pageable pageable);



}
