package com.stxvxn.parchela10.controladores;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stxvxn.parchela10.DTO.DesperdicioRequestDTO;
import com.stxvxn.parchela10.entidades.Desperdicio;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.servicios.DesperdicioServiceImpl;
import com.stxvxn.parchela10.servicios.IngredienteServiceImpl;
import com.stxvxn.parchela10.servicios.ProductoServiceImpl;

@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/desperdicios")
public class DesperdiciosController {

    @Autowired
    private DesperdicioServiceImpl desperdicioService;

    @Autowired
    private ProductoServiceImpl productoService;

    @Autowired
    private IngredienteServiceImpl ingredienteService;

    @PostMapping
    public ResponseEntity<?> crearDesperdicios(@RequestBody List<DesperdicioRequestDTO> dtos) {
        try {
            List<Desperdicio> desperdiciosGuardados = new ArrayList<>();
            for (DesperdicioRequestDTO dto : dtos) {
                Desperdicio desperdicio = new Desperdicio();
                desperdicio.setMotivo(dto.getMotivo());

                if (dto.getProductoId() != null) {
                    Producto producto = productoService.findById(dto.getProductoId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                    desperdicio.setProducto(producto);
                    desperdicio.setCantidadProducto(dto.getCantidadProducto());
                }

                if (dto.getIngredienteId() != null) {
                    Ingrediente ingrediente = ingredienteService.findById(dto.getIngredienteId())
                        .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));
                    desperdicio.setIngrediente(ingrediente);
                    desperdicio.setCantidadIngrediente(dto.getCantidadIngrediente());
                }

                desperdiciosGuardados.add(desperdicioService.registrarDesperdicio(desperdicio).orElseThrow());
            }
            return ResponseEntity.ok(desperdiciosGuardados);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
}

    @GetMapping
    public ResponseEntity<List<Desperdicio>> obtenerTodos() {
        return ResponseEntity.ok(desperdicioService.obtenerDesperdicios());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Desperdicio>> obtenerTodosPaginado(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin
    ) {
        if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaInicio no puede ser posterior a fechaFin");
        }
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "fecha"));
        return ResponseEntity.ok(desperdicioService.obtenerDesperdiciosFiltrado(fechaInicio, fechaFin, pageable));
    }

}
