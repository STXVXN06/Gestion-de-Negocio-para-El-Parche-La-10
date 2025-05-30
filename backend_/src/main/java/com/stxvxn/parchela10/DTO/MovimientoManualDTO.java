package com.stxvxn.parchela10.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class MovimientoManualDTO {
    @NotBlank(message = "El tipo es obligatorio (INGRESO/EGRESO)")
    private String tipo;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser mayor a 0")
    private Long monto;

    @NotNull(message = "El ID de la caja es obligatorio")
    private Long cajaId;
}