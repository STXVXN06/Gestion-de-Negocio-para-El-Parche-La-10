package com.stxvxn.parchela10.servicios.caja;

import java.util.Optional;

import com.stxvxn.parchela10.entidades.Caja;

/**
 * Interfaz del servicio para la entidad Caja.
 * Proporciona métodos para realizar operaciones CRUD sobre cajas.
 */
public interface ICajaService {

    Optional<Caja> abrirCaja(Caja caja);

    Optional<Caja> ajustarMontoActual(Long montoActual);

    Optional<Caja> obtenerCajaActual();

    Optional<Caja> save(Caja caja);

    

    
}
