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
    private List<ComboEnPedido> combos;
    private Integer cantidadP1;
    private Integer cantidadC1;
    private boolean domicilio;
    private Long costoDomicilio;
    private String metodoPago;
    private List<AdicionResponseDTO> adiciones; 

    @Data
    public static class ProductoEnPedido {

        private Long id;
        private String nombre;
        private Long precio;
        private Integer cantidad;
    }

    @Data
    public static class ComboEnPedido {

        private Long id;
        private String nombre;
        private Long precio; // Precio final con descuento
        private Integer cantidad;
        private List<ProductoEnPedido> productos; // Productos incluidos
    }
}
