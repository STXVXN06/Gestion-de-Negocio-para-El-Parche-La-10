package com.stxvxn.parchela10.repositorios;

import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.UnidadMedida;

/**
 * Interfaz que define el repositorio para la entidad UnidadMedida.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface UnidadMedidaRepository extends CrudRepository<UnidadMedida, Long> {

}
