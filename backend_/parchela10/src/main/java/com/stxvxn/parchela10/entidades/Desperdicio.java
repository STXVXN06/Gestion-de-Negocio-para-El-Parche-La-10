package com.stxvxn.parchela10.entidades;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "desperdicios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Desperdicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "ingrediente_id")
    private Ingrediente ingrediente;

    @Column(nullable = true)
    private Double cantidadProducto;

    @Column(nullable = true)
    private Double cantidadIngrediente;

    @NotBlank
    private String motivo;

    @NotNull
    private LocalDateTime fecha = LocalDateTime.now();

    @AssertTrue(message = "Debe ingresar al menos un producto o ingrediente")
    private boolean isValid() {
        return (cantidadProducto != null && cantidadProducto > 0) || 
               (cantidadIngrediente != null && cantidadIngrediente > 0);
    }
}
