package com.stxvxn.parchela10.repositorios;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.ProductoIngrediente;

/**
 * Interfaz que define el repositorio para la entidad ProductoIngrediente.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface ProductoIngredienteRepository extends CrudRepository<ProductoIngrediente, Long> {

    Optional<ProductoIngrediente> findByProductoIdAndIngredienteId(Long productoId, Long ingredienteId);

    List<ProductoIngrediente> findByProductoId(Long productoId);

    @Query("""
            SELECT DISTINCT pi FROM ProductoIngrediente pi
            JOIN FETCH pi.ingrediente ing
            JOIN FETCH ing.unidadMedida
            JOIN FETCH pi.producto
            WHERE pi.producto.id IN :productoIds
            """)
    List<ProductoIngrediente> findByProductoIdInWithDetails(@Param("productoIds") List<Long> productoIds);

    void deleteByProductoId(Long productoId);
}
