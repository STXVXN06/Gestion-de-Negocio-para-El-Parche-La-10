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

import com.stxvxn.parchela10.dto.ProductoConIngredienteDTO;
import com.stxvxn.parchela10.dto.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.servicios.productos.IProductoFacadeService;
import com.stxvxn.parchela10.servicios.productos.IProductoService;
import com.stxvxn.parchela10.servicios.productos.ProductoIngredienteServiceImpl;
import com.stxvxn.parchela10.servicios.productos.ProductoServiceImpl;


@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/productos")
public class ProductoController {

    private final IProductoService productoService;
    private final IProductoFacadeService productoFacadeService;

    @Autowired
    public ProductoController(
            IProductoService productoService,
            IProductoFacadeService productoFacadeService) {
        this.productoService = productoService;
        this.productoFacadeService = productoFacadeService;
    }


       /**
     * Crea un producto con sus ingredientes asociados.
     * Delega toda la lógica compleja al Facade.
     */
    @PostMapping()
    public ResponseEntity<Producto> crearProductoConIngredientes(@RequestBody ProductoConIngredienteDTO dto) {
        return productoFacadeService.crearProductoConIngredientes(dto)
                .map(producto -> ResponseEntity.status(HttpStatus.CREATED).body(producto))
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }

   /**
     * Actualiza un producto y sus ingredientes.
     * Delega la coordinación al Facade.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProductoConIngredientes(
            @PathVariable Long id,
            @RequestBody ProductoConIngredienteDTO dto) {
        return productoFacadeService.actualizarProductoConIngredientes(id, dto)
                .map(producto -> ResponseEntity.ok().body(producto))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

   /**
     * Obtiene todos los productos.
     */
    @GetMapping
    public ResponseEntity<List<Producto>> obtenerTodos() {
        return ResponseEntity.ok(productoService.findAll());
    }

  /**
     * Obtiene un producto por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable Long id) {
        return productoService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }


  /**
     * Obtiene un producto con todos sus ingredientes detallados.
     */
    @GetMapping("/{id}/ingredientes")
    public ResponseEntity<ProductoConIngredientesResponse> obtenerIngredientesDeProducto(@PathVariable Long id) {
        return productoFacadeService.obtenerProductoConIngredientes(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

  
    /**
     * Elimina (desactiva) un producto.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Producto> delete(@PathVariable Long id) {
        return productoService.delete(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    

}
