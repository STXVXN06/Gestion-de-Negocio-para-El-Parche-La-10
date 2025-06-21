package com.stxvxn.parchela10.repositorios;


import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Interfaz que define el repositorio para la entidad Compra.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface CompraRepository extends CrudRepository<Compra, Long> {

}
