package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.repositorios.CajaRepository;

/**
 * Implementación del servicio para la entidad Caja.
 * Proporciona métodos para realizar operaciones CRUD sobre cajas.
 */

@Service
public class CajaServiceImpl implements ICajaService {

    @Autowired
    private CajaRepository cajaRepository;

    @Transactional
    @Override
    public Optional<Caja> abrirCaja(Caja caja) {
       caja.setFechaInicio(LocalDateTime.now());
       caja.setMontoActual(caja.getMontoInicial());
       return Optional.of(cajaRepository.save(caja)) ;

    }


    @Transactional
    @Override
    public Optional<Caja> ajustarMontoActual( Long monto) {
       Optional<Caja> cajaOptional = obtenerCajaActual();
         if(cajaOptional.isPresent()){
                Caja cajaDb = cajaOptional.orElseThrow();
                cajaDb.setMontoActual(cajaDb.getMontoActual() + monto);
                return Optional.of(cajaRepository.save(cajaDb));
         }
         return cajaOptional;
    }


    @Transactional(readOnly = true)
    @Override
    public Optional<Caja> obtenerCajaActual() {
      return cajaRepository.findById(1L);
    }

    @Transactional
    @Override
    public Optional<Caja> save(Caja caja) {
        return Optional.of(cajaRepository.save(caja));
    }


}
