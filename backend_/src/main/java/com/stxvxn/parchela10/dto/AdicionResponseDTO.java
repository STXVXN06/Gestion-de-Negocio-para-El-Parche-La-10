package com.stxvxn.parchela10.dto;

import lombok.Data;

@Data
public class AdicionResponseDTO {
    private Long id;
    private Long ingredienteId;
    private String nombreIngrediente;
    private Integer cantidad;
    private Long precioAdicion;
    private Long subtotal;
    private String aplicadoA;
}