package com.stxvxn.parchela10.dto;

import java.util.List;

import lombok.Data;

@Data
public class ComboDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private Long precio;
    private Boolean activo;
    private List<ComboItemDTO> productos;

    @Data
    public static class ComboItemDTO {

        private Long productoId;
        private Integer cantidad;
    }
}
