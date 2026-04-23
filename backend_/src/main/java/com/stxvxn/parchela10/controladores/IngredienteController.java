package com.stxvxn.parchela10.controladores;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
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

import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.servicios.IngredienteServiceImpl;

import jakarta.validation.Valid;

@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/ingredientes")
public class IngredienteController {

    @Autowired
    private IngredienteServiceImpl ingredienteService;

    @GetMapping
    public List<Ingrediente> list() {
        return ingredienteService.findAll();
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Ingrediente>> listPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(ingredienteService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        Optional<Ingrediente> ingredienteOptional = ingredienteService.findById(id);
        if (ingredienteOptional.isPresent()) {
            return ResponseEntity.ok().body(ingredienteOptional.orElseThrow());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Ingrediente ingrediente, BindingResult result) {

        if (result.hasFieldErrors()) {
            return validation(result);
        }

        Ingrediente ingredienteNuevo = ingredienteService.save(ingrediente);
        return ResponseEntity.status(HttpStatus.CREATED).body(ingredienteNuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@Valid @RequestBody Ingrediente ingrediente, BindingResult result,
            @PathVariable Long id) {

        if (result.hasFieldErrors()) {
            return validation(result);
        }

        Optional<Ingrediente> ingredienteOptional = ingredienteService.update(id, ingrediente);

        if (ingredienteOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ingredienteOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        Optional<Ingrediente> ingredienteOptional = ingredienteService.delete(id);
        if (ingredienteOptional.isPresent()) {
            return ResponseEntity.ok().body(ingredienteOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();

    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<List<Ingrediente>> getIngredientesBajoStock() {
        List<Ingrediente> ingredientes = ingredienteService.obtenerIngredientesBajoStock();
        return ResponseEntity.ok(ingredientes);
    }

    private ResponseEntity<?> validation(BindingResult result) {
        Map<String, String> errores = new HashMap<>();
        result.getFieldErrors().forEach(err -> {
            errores.put(err.getField(), "El campo " + err.getField() + " " + err.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(errores);
    }
}