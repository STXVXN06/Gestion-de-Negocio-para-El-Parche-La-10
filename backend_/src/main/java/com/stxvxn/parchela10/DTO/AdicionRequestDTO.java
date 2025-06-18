package com.stxvxn.parchela10.DTO;

import lombok.Data;

@Data
public class AdicionRequestDTO {
    private Long ingredienteId;
    private Integer cantidad;
    private String aplicadoA;  // Ej: "Hamburguesa 1", "Mixta grande"
}