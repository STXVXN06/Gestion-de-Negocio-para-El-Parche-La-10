package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Compra;

public interface ICompraService {

    Optional<Compra> registrarCompra(Compra compra); // Suma stock, crea EGRESO en caja

    List<Compra> obtenerCompras();
    
    void eliminarCompra(Long id);
}
