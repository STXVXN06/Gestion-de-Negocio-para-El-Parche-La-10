package com.stxvxn.parchela10.controladores;

import java.util.ArrayList;
import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.DTO.ComboConPrecioDTO;
import com.stxvxn.parchela10.DTO.ComboDTO;
import com.stxvxn.parchela10.entidades.Combo;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.servicios.ComboServiceImpl;

@RestController
@CrossOrigin("http://localhost:3000")
@RequestMapping("/api/combos")
public class ComboController {

    @Autowired
    private ComboServiceImpl comboService;

    @PostMapping
    public ResponseEntity<?> crearCombo(@RequestBody ComboDTO dto) {
        try {
            Combo combo = comboService.crearCombo(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(combo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear el combo");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCombo(@PathVariable Long id, @RequestBody ComboDTO dto) {
        try {
            Combo comboActualizado = comboService.actualizarCombo(id, dto);
            return ResponseEntity.ok(comboActualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al actualizar el combo");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivarCombo(@PathVariable Long id) {
        try {
            comboService.desactivarCombo(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al desactivar el combo");
        }
    }

    @GetMapping
    public ResponseEntity<?> listarCombosActivos() {
        List<Combo> combos = comboService.listarCombosActivos();
        if (combos.isEmpty()) {
            return ResponseEntity.ok().body("No hay combos activos registrados.");
        }
        // Mapear a DTO con precio
        List<ComboConPrecioDTO> dtos = new ArrayList<>();
        for (Combo combo : combos) {
            ComboConPrecioDTO dto = new ComboConPrecioDTO();
            dto.setId(combo.getId());
            dto.setNombre(combo.getNombre());
            dto.setDescripcion(combo.getDescripcion());
            dto.setDescuento(combo.getDescuento());
            dto.setActivo(combo.getActivo());
            dto.setPrecio(comboService.calcularPrecioCombo(combo.getId())); // Calcular precio

            // Obtener productos del combo
            List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(combo.getId());
            List<ComboConPrecioDTO.ProductoEnComboDTO> productosDTO = new ArrayList<>();

            for (ComboProducto cp : productosCombo) {
                ComboConPrecioDTO.ProductoEnComboDTO prodDTO
                        = new ComboConPrecioDTO.ProductoEnComboDTO();
                prodDTO.setId(cp.getProducto().getId());
                prodDTO.setNombre(cp.getProducto().getNombre());
                prodDTO.setPrecio(cp.getProducto().getPrecio());
                prodDTO.setCantidad(cp.getCantidad());
                productosDTO.add(prodDTO);
            }

            dto.setProductos(productosDTO);

            dtos.add(dto);
        }

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}/precio")
    public ResponseEntity<?> obtenerPrecioCombo(@PathVariable Long id) {
        try {
            Long precio = comboService.calcularPrecioCombo(id);
            return ResponseEntity.ok(precio);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al obtener el precio del combo");
        }
    }
}
