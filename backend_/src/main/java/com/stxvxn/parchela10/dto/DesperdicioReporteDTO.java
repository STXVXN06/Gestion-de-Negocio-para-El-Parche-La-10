package com.stxvxn.parchela10.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class DesperdicioReporteDTO {
    private Long id;
    private LocalDateTime fecha;
    private String motivo;
    private String tipoItem; // "INGREDIENTE" o "PRODUCTO"
    private String nombreItem;
    private Double cantidad;
    private String unidadMedida;
}