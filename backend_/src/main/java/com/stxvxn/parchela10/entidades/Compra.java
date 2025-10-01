package com.stxvxn.parchela10.entidades;

import java.time.LocalDateTime;
import java.time.ZoneId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "compras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ingrediente_id")
    private Ingrediente ingrediente;

    @NotNull
    @Enumerated(EnumType.STRING)
    private TipoCompra tipo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = true)
    @Positive
    private Double cantidad;

    @NotNull
    private Long costoTotal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EstadoCompra estado = EstadoCompra.ACTIVO;

    @NotNull
    @Builder.Default
    private LocalDateTime fecha = LocalDateTime.now(ZoneId.of("America/Bogota"));

    // Método para encapsular la lógica de anulación
    public void anular() {
        if (this.estado == EstadoCompra.ANULADA) {
            throw new IllegalStateException("La compra ya está anulada");
        }
        this.estado = EstadoCompra.ANULADA;
    }

    public boolean esDeIngrediente() {
        return tipo == TipoCompra.INGREDIENTE;
    }

    public boolean estaActiva() {
        return estado == EstadoCompra.ACTIVO;
    }

    // Enums para mejorar type safety
    public enum TipoCompra {
        INGREDIENTE,
        ASEO,
        MATERIALES,
        UTENSILIOS,
        SERVICIO,
        EQUIPO,
        OTROS
    }

    public enum EstadoCompra {
        ACTIVO,
        ANULADA
    }
}
