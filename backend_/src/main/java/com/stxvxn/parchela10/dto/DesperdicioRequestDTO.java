package com.stxvxn.parchela10.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
@Data
public class DesperdicioRequestDTO {
    private Long productoId;
    private Long ingredienteId;
    
    @PositiveOrZero(message = "La cantidad debe ser 0 o mayor")
    private Double cantidadProducto;
    
    @PositiveOrZero(message = "La cantidad debe ser 0 o mayor")
    private Double cantidadIngrediente;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    // Validación personalizada
    @AssertTrue(message = "Debe ingresar al menos un producto o ingrediente")
    private boolean isValid() {
        return (cantidadProducto != null && cantidadProducto > 0) || 
               (cantidadIngrediente != null && cantidadIngrediente > 0);
    }
}
