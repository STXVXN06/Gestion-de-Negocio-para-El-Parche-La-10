package com.stxvxn.parchela10.DTO;

import java.util.List;

import lombok.Data;

@Data
public class PedidoRequestDTO {

    private List<ProductoCantidadDTO> productos;
    private List<PedidoComboDTO> combos;
    private String detalles;

    @Data
    public static class ProductoCantidadDTO {

        private Long productoId;
        private Integer cantidad;
    }
}
