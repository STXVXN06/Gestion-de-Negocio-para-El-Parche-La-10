package com.stxvxn.parchela10.repositorios;
import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Caja;



/**
 * Interfaz que define el repositorio para la entidad Caja.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */

public interface CajaRepository extends CrudRepository<Caja, Long> {
    
}
