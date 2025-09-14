package com.stxvxn.parchela10.servicios;

import java.time.LocalDateTime;
import java.util.List;

import com.stxvxn.parchela10.DTO.AdicionReporteDTO;
import com.stxvxn.parchela10.DTO.DesperdicioReporteDTO;
import com.stxvxn.parchela10.DTO.IngredienteUsoDTO;
import com.stxvxn.parchela10.DTO.ProductoVentaDTO;

public interface IReporteService {

    Long calcularGanancias(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    Long calcularIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    Long calcularEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    List<ProductoVentaDTO> obtenerProductosMasVendidos(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    List<IngredienteUsoDTO> obtenerIngredientesUtilizados(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    List<AdicionReporteDTO> obtenerAdicionesIngredientes(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    List<DesperdicioReporteDTO> obtenerDesperdicios(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
