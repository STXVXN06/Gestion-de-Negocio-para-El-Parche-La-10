package com.stxvxn.parchela10.repositorios;

import org.springframework.data.repository.CrudRepository;
import com.stxvxn.parchela10.entidades.Pedido;

/**
 * Interfaz que define el repositorio para la entidad Pedido.
 * Extiende CrudRepository para proporcionar operaciones CRUD básicas.
 */
public interface PedidoRepository extends CrudRepository<Pedido, Long> {
    

}
