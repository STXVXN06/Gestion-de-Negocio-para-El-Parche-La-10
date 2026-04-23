package com.stxvxn.parchela10.controladores;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stxvxn.parchela10.DTO.MovimientoCajaListadoDTO;
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
    public ResponseEntity<Page<MovimientoCajaListadoDTO>> listarMovimientos(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin
    ) {
        if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "fechaInicio no puede ser posterior a fechaFin");
        }
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "fecha"));
        Page<MovimientoCaja> pageRes = movimientoCajaService.listarMovimientos(tipo, fechaInicio, fechaFin, pageable);
        Page<MovimientoCajaListadoDTO> dtoPage = pageRes.map(m -> new MovimientoCajaListadoDTO(
                m.getId(),
                m.getTipo(),
                m.getDescripcion(),
                m.getMonto(),
                m.getEstado(),
                m.getFecha()
        ));
        return ResponseEntity.ok(dtoPage);
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