package com.stxvxn.parchela10.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class IngredienteUsoDTO {
    private Long ingredienteId;
    private String nombreIngrediente;
    private Double cantidadUsada;
    private String unidadMedida;
    // getters y setters
}