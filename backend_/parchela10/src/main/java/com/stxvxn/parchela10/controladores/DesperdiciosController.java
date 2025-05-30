package com.stxvxn.parchela10.controladores;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
