package com.stxvxn.parchela10.controladores;

import java.time.LocalDateTime;
import java.util.List;

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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.servicios.CompraServiceImpl;


@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/compras")
public class CompraController {
    @Autowired
    private CompraServiceImpl compraService;

    @GetMapping
    public ResponseEntity<List<Compra>> obtenerTodasLasCompras() {
        return ResponseEntity.ok(compraService.obtenerCompras());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Compra>> obtenerComprasPaginado(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin
    ) {
        if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaInicio no puede ser posterior a fechaFin");
        }
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "fecha"));

        Boolean soloAnuladas = null;
        if (estado != null && !estado.isBlank()) {
            String e = estado.trim().toUpperCase();
            if ("ANULADAS".equals(e) || "ANULADA".equals(e)) {
                soloAnuladas = true;
            } else if ("ACTIVAS".equals(e) || "ACTIVA".equals(e) || "TODAS".equals(e)) {
                soloAnuladas = false;
            }
        }
        if (estado == null || estado.isBlank() || "TODAS".equalsIgnoreCase(estado.trim())) {
            soloAnuladas = null;
        }

        return ResponseEntity.ok(compraService.obtenerComprasFiltrado(soloAnuladas, fechaInicio, fechaFin, pageable));
    }

    @PostMapping
    public ResponseEntity<Compra> crearCompra(@RequestBody Compra compra) {
        return compraService.registrarCompra(compra)
                .map(compraGuardada -> ResponseEntity.status(HttpStatus.CREATED).body(compraGuardada))
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> eliminarCompra(@PathVariable Long id) {
        compraService.eliminarCompra(id);
        return ResponseEntity.noContent().build();
    }
}
