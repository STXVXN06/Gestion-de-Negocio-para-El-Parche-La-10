package com.stxvxn.parchela10.controladores;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.servicios.compras.ICompraService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el manejo de compras
 * 
 * ✅ SRP: Solo maneja solicitudes HTTP y respuestas
 * ✅ DIP: Depende de la abstracción ICompraService
 */
@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/compras")
@RequiredArgsConstructor
public class CompraController {

    private final ICompraService compraService;

    /**
     * Obtiene todas las compras registradas
     * GET /api/compras
     */
    @GetMapping
    public ResponseEntity<List<Compra>> obtenerTodasLasCompras() {
        List<Compra> compras = compraService.obtenerTodasLasCompras();
        return ResponseEntity.ok(compras);
    }

    /**
     * Registra una nueva compra
     * POST /api/compras
     */
    @PostMapping
    public ResponseEntity<?> registrarCompra(@Valid @RequestBody Compra compra) {
        try {
            Compra compraGuardada = compraService.registrarCompra(compra);
            return ResponseEntity.status(HttpStatus.CREATED).body(compraGuardada);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Anula una compra existente
     * DELETE /api/compras/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> anularCompra(@PathVariable Long id) {
        try {
            compraService.anularCompra(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // DTO para respuestas de error
    private record ErrorResponse(String mensaje) {}
}