package com.stxvxn.parchela10.repositorios;
import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.Producto;

/**
 * Interfaz que define el repositorio para la entidad Producto.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface ProductoRepository extends CrudRepository<Producto, Long> {
  
}
