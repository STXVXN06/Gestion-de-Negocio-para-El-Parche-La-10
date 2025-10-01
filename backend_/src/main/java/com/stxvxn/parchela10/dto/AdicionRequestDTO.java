package com.stxvxn.parchela10.dto;

import lombok.Data;

@Data
public class AdicionRequestDTO {
    private Long ingredienteId;
    private Integer cantidad;
    private String aplicadoA;  // Ej: "Hamburguesa 1", "Mixta grande"
}