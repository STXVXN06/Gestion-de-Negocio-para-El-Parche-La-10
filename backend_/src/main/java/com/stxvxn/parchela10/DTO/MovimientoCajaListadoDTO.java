package com.stxvxn.parchela10.DTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MovimientoCajaListadoDTO {
    private Long id;
    private String tipo;
    private String descripcion;
    private Long monto;
    private String estado;
    private LocalDateTime fecha;
}

