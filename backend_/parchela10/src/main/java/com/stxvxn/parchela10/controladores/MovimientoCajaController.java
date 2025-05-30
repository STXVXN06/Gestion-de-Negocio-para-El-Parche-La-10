package com.stxvxn.parchela10.controladores;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.DTO.MovimientoManualDTO;
import com.stxvxn.parchela10.entidades.MovimientoCaja;
import com.stxvxn.parchela10.servicios.MovimientoCajaServiceImpl;

import jakarta.validation.Valid;

@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/movimientosCaja")
public class MovimientoCajaController {

    @Autowired
    private MovimientoCajaServiceImpl movimientoCajaService;

    // Crear movimiento manual (sin relación con Compra/Pedido)
    @PostMapping("/manual")
    public ResponseEntity<MovimientoCaja> crearMovimientoManual(
            @Valid @RequestBody MovimientoManualDTO dto
    ) {
        MovimientoCaja movimiento = movimientoCajaService.registrarMovimientoManual(
                dto.getTipo(),
                dto.getDescripcion(),
                dto.getMonto(),
                dto.getCajaId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(movimiento);
    }

    // Obtener todos los movimientos (filtrados por tipo si se requiere)
    @GetMapping
    public ResponseEntity<List<MovimientoCaja>> listarMovimientos(
            @RequestParam(required = false) String tipo
    ) {
        List<MovimientoCaja> movimientos = tipo != null 
                ? movimientoCajaService.obtenerPorTipo(tipo)
                : movimientoCajaService.findAll();
        return ResponseEntity.ok(movimientos);
    }

    // Eliminar movimiento (anulación lógica)
    @PutMapping("/{id}")
    public ResponseEntity<MovimientoCaja> anularMovimiento(@PathVariable Long id) {
        Optional<MovimientoCaja> movimiento = movimientoCajaService.anularMovimiento(id);
        if(movimiento.isPresent()){
            return ResponseEntity.ok(movimiento.orElseThrow());
        } else {
            return ResponseEntity.notFound().build();

        }
    }
}