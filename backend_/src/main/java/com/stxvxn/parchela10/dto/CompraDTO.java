package com.stxvxn.parchela10.dto;

import java.time.LocalDateTime;

import com.stxvxn.parchela10.entidades.Compra;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para transferencia de datos de compras
 * Separa la capa de presentación de la entidad de dominio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompraDTO {

    private Long id;

    @NotNull(message = "El ID del ingrediente es obligatorio para compras de ingredientes")
    private Long ingredienteId;

    private String ingredienteNombre;

    @NotNull(message = "El tipo de compra es obligatorio")
    private Compra.TipoCompra tipo;

    private String descripcion;

    @Positive(message = "La cantidad debe ser positiva")
    private Double cantidad;

    private String unidadMedida;

    @NotNull(message = "El costo total es obligatorio")
    @Positive(message = "El costo total debe ser positivo")
    private Long costoTotal;

    private Compra.EstadoCompra estado;

    private LocalDateTime fecha;

    /**
     * Convierte una entidad Compra a DTO
     */
    public static CompraDTO fromEntity(Compra compra) {
        CompraDTO dto = CompraDTO.builder()
                .id(compra.getId())
                .tipo(compra.getTipo())
                .descripcion(compra.getDescripcion())
                .cantidad(compra.getCantidad())
                .costoTotal(compra.getCostoTotal())
                .estado(compra.getEstado())
                .fecha(compra.getFecha())
                .build();

        if (compra.getIngrediente() != null) {
            dto.setIngredienteId(compra.getIngrediente().getId());
            dto.setIngredienteNombre(compra.getIngrediente().getNombre());
            
            if (compra.getIngrediente().getUnidadMedida() != null) {
                dto.setUnidadMedida(compra.getIngrediente().getUnidadMedida().getSimbolo());
            }
        }

        return dto;
    }

    /**
     * Convierte el DTO a entidad Compra
     */
    public Compra toEntity() {
        return Compra.builder()
                .tipo(this.tipo)
                .descripcion(this.descripcion)
                .cantidad(this.cantidad)
                .costoTotal(this.costoTotal)
                .build();
    }
}