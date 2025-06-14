package com.stxvxn.parchela10.DTO;

import java.util.List;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class EditarPedidoDTO {

    private String detalles;
    private List<ProductoCantidadDTO> productos;
    private List<ComboCantidadDTO> combos; // Nuevo campo
    private Integer cantidadP1;
    private Integer cantidadC1;

    @PositiveOrZero(message = "El costo de domicilio debe ser positivo")
    private Long costoDomicilio;
    private boolean domicilio;

    @Data
    public static class ProductoCantidadDTO {

        private Long productoId;
        private Integer cantidad;
    }

    @Data
    public static class ComboCantidadDTO {

        private Long comboId;
        private Integer cantidad;
    }
}
