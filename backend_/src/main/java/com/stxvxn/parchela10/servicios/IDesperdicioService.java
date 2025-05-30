package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Desperdicio;

public interface IDesperdicioService {

    Optional<Desperdicio> registrarDesperdicio(Desperdicio desperdicio); // resta stock, crea EGRESO en caja

    List<Desperdicio> obtenerDesperdicios();
}

