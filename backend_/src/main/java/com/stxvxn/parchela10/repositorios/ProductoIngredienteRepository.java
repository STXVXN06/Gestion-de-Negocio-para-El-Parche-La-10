package com.stxvxn.parchela10.repositorios;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import java.util.List;

/**
 * Interfaz que define el repositorio para la entidad ProductoIngrediente.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface ProductoIngredienteRepository extends CrudRepository<ProductoIngrediente, Long> {

    Optional<ProductoIngrediente> findByProductoIdAndIngredienteId(Long productoId, Long ingredienteId);

    List<ProductoIngrediente> findByProductoId(Long productoId);

    void deleteByProductoId(Long productoId);
}
