package com.stxvxn.parchela10.entidades;

import java.time.LocalDateTime;
import java.time.ZoneId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "compras")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ingrediente_id")
    private Ingrediente ingrediente;

    @NotBlank
    private String tipo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = true)
    private Double cantidad;

    @NotNull
    private Long costoTotal;

    private String estado = "activo";

    @NotNull
    private LocalDateTime fecha = LocalDateTime.now(ZoneId.of("America/Bogota"));
}
