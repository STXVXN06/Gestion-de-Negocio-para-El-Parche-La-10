package com.stxvxn.parchela10.controladores;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear el combo" + e.getMessage());
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
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Long> comboIds = combos.stream().map(Combo::getId).toList();
        List<ComboProducto> productosCombos = comboService.obtenerProductosDeCombos(comboIds);
        return ResponseEntity.ok(mapCombosToDtos(combos, productosCombos));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<ComboConPrecioDTO>> listarCombosActivosPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "id"));

        Page<Combo> combosPage = comboService.listarCombosActivos(pageable);
        List<Combo> combos = combosPage.getContent();
        if (combos.isEmpty()) {
            return ResponseEntity.ok(Page.empty(pageable));
        }

        List<Long> comboIds = combos.stream().map(Combo::getId).toList();
        List<ComboProducto> productosCombos = comboService.obtenerProductosDeCombos(comboIds);
        List<ComboConPrecioDTO> dtos = mapCombosToDtos(combos, productosCombos);

        return ResponseEntity.ok(new PageImpl<>(dtos, pageable, combosPage.getTotalElements()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerCombo(@PathVariable Long id) {
        Optional<Combo> comboOpt = comboService.findById(id);
        if (!comboOpt.isPresent()) {
            return ResponseEntity.ok().body("No existe el combo con el id: " + id);
        }
        Combo combo = comboOpt.orElseThrow();

        List<ComboProducto> productosCombo = comboService.obtenerProductoDelCombo(combo.getId());
        return ResponseEntity.ok(mapComboToDto(combo, productosCombo));

    }

    @GetMapping("/{id}/precio")
    public ResponseEntity<?> obtenerPrecioCombo(@PathVariable Long id) {
        Combo combo = comboService.findById(id).orElseThrow();
        return ResponseEntity.ok(combo.getPrecio());

    }

    private static ComboConPrecioDTO mapComboToDto(Combo combo, List<ComboProducto> productosCombo) {
        ComboConPrecioDTO dto = new ComboConPrecioDTO();
        dto.setId(combo.getId());
        dto.setNombre(combo.getNombre());
        dto.setDescripcion(combo.getDescripcion());
        dto.setActivo(combo.getActivo());
        dto.setPrecio(combo.getPrecio());

        List<ComboConPrecioDTO.ProductoEnComboDTO> productosDTO = new ArrayList<>();
        for (ComboProducto cp : productosCombo) {
            ComboConPrecioDTO.ProductoEnComboDTO prodDTO = new ComboConPrecioDTO.ProductoEnComboDTO();
            prodDTO.setId(cp.getProducto().getId());
            prodDTO.setNombre(cp.getProducto().getNombre());
            prodDTO.setPrecio(cp.getProducto().getPrecio());
            prodDTO.setCantidad(cp.getCantidad());
            productosDTO.add(prodDTO);
        }
        dto.setProductos(productosDTO);
        return dto;
    }

    private static List<ComboConPrecioDTO> mapCombosToDtos(List<Combo> combos, List<ComboProducto> productosCombos) {
        Map<Long, List<ComboProducto>> byComboId = new HashMap<>();
        for (ComboProducto cp : productosCombos) {
            Long comboId = cp.getCombo().getId();
            byComboId.computeIfAbsent(comboId, __ -> new ArrayList<>()).add(cp);
        }

        return combos.stream()
                .map(combo -> mapComboToDto(combo, byComboId.getOrDefault(combo.getId(), List.of())))
                .collect(Collectors.toList());
    }
}
