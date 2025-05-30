package com.stxvxn.parchela10.DTO;

import java.util.List;

import lombok.Data;

@Data
public class EditarPedidoDTO {

    private String detalles;
    private List<ProductoCantidadDTO> productos;

    @Data
    public static class ProductoCantidadDTO {
        private Long productoId;
        private Integer cantidad;
    }
}
