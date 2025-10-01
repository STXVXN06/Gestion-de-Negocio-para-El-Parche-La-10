package com.stxvxn.parchela10.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AdicionReporteDTO {
    private Long pedidoId;
    private String ingredienteNombre;
    private Double cantidad;
    private String unidadMedida;
    private LocalDateTime fecha;
    private String aplicadoA;
}