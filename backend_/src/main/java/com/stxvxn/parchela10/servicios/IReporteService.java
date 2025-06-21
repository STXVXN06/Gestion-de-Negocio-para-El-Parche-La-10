package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;

public interface IReporteService {
    
    public Long calcularGanancias(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public Long calcularIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public Long calcularEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);


}
