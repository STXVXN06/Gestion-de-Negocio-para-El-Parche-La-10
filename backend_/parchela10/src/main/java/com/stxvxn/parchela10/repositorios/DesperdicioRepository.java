package com.stxvxn.parchela10.repositorios;

import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.Desperdicio;

/**
 * Interfaz que define el repositorio para la entidad Desperdicio.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface DesperdicioRepository extends CrudRepository<Desperdicio, Long> {

}
