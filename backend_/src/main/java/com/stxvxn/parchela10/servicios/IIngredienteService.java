package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Ingrediente;

/**
 * Interfaz que define los métodos del servicio para la entidad Ingrediente.
 * Proporciona operaciones CRUD y búsqueda de ingredientes.
 */
public interface IIngredienteService {

    List<Ingrediente> findAll();

    Optional<Ingrediente> findById(Long id);

    Ingrediente save(Ingrediente ingrediente);

    Optional<Ingrediente> update(Long id, Ingrediente ingrediente);

    Optional<Ingrediente> delete(Long id);

    Optional<Ingrediente> findByNombre(String nombre);

    List<Ingrediente> obtenerIngredientesBajoStock();

}
