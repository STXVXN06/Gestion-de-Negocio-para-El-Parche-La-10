package com.stxvxn.parchela10.DTO;

import java.util.List;

import lombok.Data;

@Data
public class ComboConPrecioDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private Double descuento;
    private Boolean activo;
    private Long precio; // Nuevo campo para el precio calculado
    private List<ProductoEnComboDTO> productos;

    @Data
    public static class ProductoEnComboDTO {

        private Long id;
        private String nombre;
        private Long precio;
        private Integer cantidad;
    }
}
