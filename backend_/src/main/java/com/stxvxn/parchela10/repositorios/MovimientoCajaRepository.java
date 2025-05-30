package com.stxvxn.parchela10.repositorios;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.MovimientoCaja;

/**
 * Interfaz que define el repositorio para la entidad MovimientoCaja.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface MovimientoCajaRepository extends CrudRepository<MovimientoCaja, Long> {

    Optional<MovimientoCaja> findByCompraId(Long compraId);

    List<MovimientoCaja> findByTipoIgnoreCase(String tipo);

}
