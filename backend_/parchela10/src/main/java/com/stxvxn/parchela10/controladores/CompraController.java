package com.stxvxn.parchela10.controladores;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.servicios.CompraServiceImpl;
import com.stxvxn.parchela10.servicios.ICompraService;


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
