package com.stxvxn.parchela10.DTO;

import lombok.Data;

@Data
public class AdicionResponseDTO {
    private Long id;
    private String nombreIngrediente;
    private Integer cantidad;
    private Long precioAdicion;
    private Long subtotal;
    private String aplicadoA;
}