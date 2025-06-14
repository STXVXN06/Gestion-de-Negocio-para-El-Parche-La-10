package com.stxvxn.parchela10.DTO;

import java.util.List;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class PedidoRequestDTO {

    private List<ProductoCantidadDTO> productos;
    private List<PedidoComboDTO> combos;
    private String detalles;
    private Integer cantidadP1;
    private Integer cantidadC1;


    private boolean domicilio = false;
    
    @PositiveOrZero(message = "El costo de domicilio debe ser positivo")
    private Long costoDomicilio = 2000L;

    @Data
    public static class ProductoCantidadDTO {

        private Long productoId;
        private Integer cantidad;
    }
}
