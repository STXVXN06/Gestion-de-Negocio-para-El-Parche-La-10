package com.stxvxn.parchela10.controladores;

import java.util.List;
import java.util.Optional;

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

import com.stxvxn.parchela10.DTO.ProductoConIngredienteDTO;
import com.stxvxn.parchela10.DTO.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.servicios.ProductoIngredienteServiceImpl;
import com.stxvxn.parchela10.servicios.ProductoServiceImpl;


@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoServiceImpl productoService;

    @Autowired
    private ProductoIngredienteServiceImpl productoIngredienteService;


    @PostMapping()
    public ResponseEntity<Producto> crearProductoConIngredientes (@RequestBody ProductoConIngredienteDTO dto) {
        Producto producto = new Producto();
        producto.setNombre(dto.getNombre());
        producto.setTipo(dto.getTipo());
        producto.setPrecio(dto.getPrecio());
        producto.setActivo(true);

        Producto productoNuevo = productoService.save(producto);

        for (ProductoConIngredienteDTO.IngredienteCantidad ing : dto.getIngredientes()){
            productoIngredienteService.agregarIngredienteAProducto(productoNuevo.getId(), ing.getIngredienteId(), ing.getCantidad());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(productoNuevo);
        
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProductoConIngredientes (@RequestBody ProductoConIngredienteDTO dto, @PathVariable Long id) {
        Producto producto = new Producto();
        producto.setId(id);
        producto.setNombre(dto.getNombre());
        producto.setTipo(dto.getTipo());
        producto.setPrecio(dto.getPrecio());
        producto.setActivo(dto.getActivo() != null ? dto.getActivo() : true);

        Optional<Producto> productoOptional = productoService.update(id, producto);
        Producto prod = productoOptional.orElseThrow();
        
        // 2. Actualizar ingredientes
        if(dto.getIngredientes() != null) {
            // Eliminar relaciones existentes
            productoIngredienteService.eliminarIngredientesDeProducto(prod.getId());

            
            // Crear nuevas relaciones
            for (ProductoConIngredienteDTO.IngredienteCantidad ing : dto.getIngredientes()){

                if(ing.getIngredienteId() == null || ing.getCantidad() == null){
                    return ResponseEntity.badRequest().build();
                }

                productoIngredienteService.agregarIngredienteAProducto(
                    productoOptional.orElseThrow().getId(), 
                    ing.getIngredienteId(), 
                    ing.getCantidad()
                );
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(prod);
        
    }

    @GetMapping
    public ResponseEntity<List<Producto>> obtenerTodos() {
        return ResponseEntity.ok(productoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable Long id){

        Optional<Producto> producto = productoService.findById(id);
        if (producto.isPresent()) {
            return ResponseEntity.ok().body(producto.orElseThrow());
        } else {
            return ResponseEntity.notFound().build();
        }

    }



    @GetMapping("/{id}/ingredientes")
    public ResponseEntity<ProductoConIngredientesResponse> obtenerIngredientesDeProducto(@PathVariable Long id){
        List<ProductoIngrediente> ingredientes = productoIngredienteService.obtenerIngredientesDeProducto(id);
        if( !ingredientes.isEmpty()){
            Producto producto = ingredientes.get(0).getProducto();
            
            ProductoConIngredientesResponse dto = new ProductoConIngredientesResponse();
            dto.setId(producto.getId());
            dto.setNombre(producto.getNombre());
            dto.setTipo(producto.getTipo());
            dto.setPrecio(producto.getPrecio());
            dto.setActivo(producto.getActivo());
            
            List<ProductoConIngredientesResponse.IngredienteDetalle> ingredientesDetalles = ingredientes.stream()
                    .map(pi -> {
                        ProductoConIngredientesResponse.IngredienteDetalle detalle = new ProductoConIngredientesResponse.IngredienteDetalle();
                        detalle.setId(pi.getIngrediente().getId());
                        detalle.setNombre(pi.getIngrediente().getNombre());
                        detalle.setUnidadMedida(pi.getIngrediente().getUnidadMedida().getNombre());
                        detalle.setSimbolo(pi.getIngrediente().getUnidadMedida().getSimbolo());
                        detalle.setCantidadNecesaria(pi.getCantidadNecesaria());
                        return detalle;
                    })
                    .toList();
            dto.setIngredientes(ingredientesDetalles);
            return ResponseEntity.ok().body(dto);
        }

        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        Optional<Producto> productoOptional = productoService.delete(id);
        if (productoOptional.isPresent()) {
            return ResponseEntity.ok().body(productoOptional.orElseThrow());
        } 
        return ResponseEntity.notFound().build();


    }
    

}
