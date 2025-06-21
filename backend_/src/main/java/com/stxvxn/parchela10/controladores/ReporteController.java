package com.stxvxn.parchela10.controladores;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.servicios.ReporteServiceImpl;

@RestController
@RequestMapping("/api/reportes")
@CrossOrigin(value = "http://localhost:3000")
public class ReporteController {

    @Autowired
    private ReporteServiceImpl reporteService;

    @GetMapping("/ganancias")
    public ResponseEntity<Long> getGanancias(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {

        Long ganancias = reporteService.calcularGanancias(fechaInicio, fechaFin);
        return ResponseEntity.ok(ganancias);
    }

    @GetMapping("/ingresos")
    public ResponseEntity<Long> getIngresos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {

        Long ingresos = reporteService.calcularIngresos(fechaInicio, fechaFin);
        return ResponseEntity.ok(ingresos);
    }

    @GetMapping("/egresos")
    public ResponseEntity<Long> getEgresos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {

        Long egresos = reporteService.calcularEgresos(fechaInicio, fechaFin);
        return ResponseEntity.ok(egresos);
    }
}