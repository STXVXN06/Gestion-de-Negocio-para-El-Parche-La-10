package com.stxvxn.parchela10.repositorios;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Ingrediente;

/**
 * Interfaz que define el repositorio para la entidad Ingrediente. Extiende
 * CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface IngredienteRepository extends CrudRepository<Ingrediente, Long> {

    Optional<Ingrediente> findByNombre(String nombre);


    @Query("SELECT i FROM Ingrediente i WHERE i.cantidadActual < i.cantidadMinima")
    List<Ingrediente> findIngredientesBajoStock();

    
}
