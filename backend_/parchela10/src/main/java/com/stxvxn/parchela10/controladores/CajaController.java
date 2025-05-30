package com.stxvxn.parchela10.controladores;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.servicios.CajaServiceImpl;


@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/caja")
public class CajaController {

    @Autowired
    private CajaServiceImpl cajaService;

    @GetMapping
    public ResponseEntity<Caja> obtenerCaja() {
        Optional<Caja> caja = cajaService.obtenerCajaActual();
        return ResponseEntity.ok(caja.orElseThrow());
}
}
