package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;
import java.util.List;

import com.stxvxn.parchela10.DTO.IngredienteUsoDTO;
import com.stxvxn.parchela10.DTO.ProductoVentaDTO;

public interface IReporteService {
    
    public Long calcularGanancias(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public Long calcularIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public Long calcularEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public List<ProductoVentaDTO> obtenerProductosMasVendidos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    public List<IngredienteUsoDTO> obtenerIngredientesUtilizados(LocalDateTime fechaInicio, LocalDateTime fechaFin);


}
