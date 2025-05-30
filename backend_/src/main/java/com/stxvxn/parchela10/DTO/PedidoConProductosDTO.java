package com.stxvxn.parchela10.DTO;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;


@Data
public class PedidoConProductosDTO {
    private Long id;
    private LocalDateTime fecha;
    private String estado;
    private Long total;
    private String detalles;
    private List<ProductoEnPedido> productos;

    @Data
    public static class ProductoEnPedido {
        private Long id;
        private String nombre;
        private Long precio;
        private Integer cantidad;
    }
}