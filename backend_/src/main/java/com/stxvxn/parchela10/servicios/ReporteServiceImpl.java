package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.repositorios.MovimientoCajaRepository;

@Service
public class ReporteServiceImpl implements IReporteService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;


    @Override
    public Long calcularGanancias(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Long ingresos = movimientoCajaRepository.sumIngresosByFechaBetween(fechaInicio, fechaFin);
        Long egresos = movimientoCajaRepository.sumEgresosByFechaBetween(fechaInicio, fechaFin);
        return (ingresos != null ? ingresos : 0) - (egresos != null ? egresos : 0);
    }

    @Override
    public Long calcularIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return movimientoCajaRepository.sumIngresosByFechaBetween(fechaInicio, fechaFin);
    }

    @Override
    public Long calcularEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return movimientoCajaRepository.sumEgresosByFechaBetween(fechaInicio, fechaFin);
    }

}
