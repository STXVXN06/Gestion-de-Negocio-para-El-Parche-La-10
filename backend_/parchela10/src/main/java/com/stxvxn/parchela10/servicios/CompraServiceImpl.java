package com.stxvxn.parchela10.servicios;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.repositorios.CompraRepository;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;

/**
 * Implementación del servicio para la entidad Compra.
 * Proporciona métodos para registrar compras y obtener la lista de compras.
 */


@Service
public class CompraServiceImpl implements ICompraService {

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Autowired
    private MovimientoCajaServiceImpl movimientoCajaService;

    @Autowired
    private CajaServiceImpl cajaService;

    @Transactional
    @Override
    public Optional<Compra> registrarCompra(Compra compra) {

        String descripcionTemp = "";

        // Validar tipod e compra
        if ("INGREDIENTE".equalsIgnoreCase(compra.getTipo())){
            // Validar que el ingrediente no esté vacío
            if (compra.getIngrediente() == null || compra.getCantidad() == null) {
                return Optional.empty();
            }



            Optional<Ingrediente> ingredienteOptional = ingredienteRepository.findById(compra.getIngrediente().getId());

            if(ingredienteOptional.isPresent()){
                Ingrediente ingrediente = ingredienteOptional.orElseThrow();


                // Sumar la cantidad comprada al ingrediente
                ingrediente.setCantidadActual(ingrediente.getCantidadActual() + compra.getCantidad());
                ingredienteRepository.save(ingrediente);

                // Validar que exista unidad de medida
                if(ingrediente.getUnidadMedida() == null) {
                    throw new RuntimeException("El ingrediente no tiene unidad de medida asignada");
                }
                
                // Actualizar campos de descripción automáticamente
                compra.setDescripcion(ingrediente.getNombre() + 
                                    " (" + compra.getCantidad() + 
                                    " " + ingrediente.getUnidadMedida().getSimbolo() + ")");
                
                descripcionTemp = "Compra de " + ingrediente.getNombre() + 
                                    " (" + compra.getCantidad() + 
                                    " " + ingrediente.getUnidadMedida().getSimbolo() + ")";

                
                
            }
            
        }else{
            compra.setCantidad(null);

        }
        String descripcion = "INGREDIENTE".equalsIgnoreCase(compra.getTipo()) 
                ? descripcionTemp
                : compra.getDescripcion();

        
        
        // GUardar compra
        Compra compraGuardada = compraRepository.save(compra);
                
        // Registrar EGRESO en caja
        movimientoCajaService.registrarEgreso(descripcion, compra.getCostoTotal(), cajaService.obtenerCajaActual().orElseThrow().getId(), compraGuardada, null);
                

        return Optional.of(compraGuardada);
    }




    @Transactional(readOnly = true)
    @Override
    public List<Compra> obtenerCompras() {
        return (List<Compra>) compraRepository.findAll();
    }

    @Transactional
    @Override
    public void eliminarCompra(Long id) {
        Optional<Compra> compraOptional = compraRepository.findById(id);
        if (compraOptional.isPresent()) {
            Compra compra = compraOptional.orElseThrow();
           
            // Eliminar el movimiento de caja asociado a la compra
            movimientoCajaService.eliminarPorCompra(compra.getId());
            
            cajaService.ajustarMontoActual(compra.getCostoTotal());
            compra.setEstado("ANULADA");
            
            compraRepository.save(compra);

            if ("INGREDIENTE".equalsIgnoreCase(compra.getTipo())){
                // Validar que el ingrediente no esté vacío
                if (compra.getIngrediente() == null || compra.getCantidad() == null) {
                    return;
                }
    
    
    
                Optional<Ingrediente> ingredienteOptional = ingredienteRepository.findById(compra.getIngrediente().getId());
    
                if(ingredienteOptional.isPresent()){
                    Ingrediente ingrediente = ingredienteOptional.orElseThrow();
    
    
                    // Sumar la cantidad comprada al ingrediente
                    ingrediente.setCantidadActual(ingrediente.getCantidadActual() - compra.getCantidad());
                    ingredienteRepository.save(ingrediente);
    
                    // Validar que exista unidad de medida
                    if(ingrediente.getUnidadMedida() == null) {
                        throw new RuntimeException("El ingrediente no tiene unidad de medida asignada");
                    }
                  
                    
                }
                
            }else{
                compra.setCantidad(null);
    
            }
        }
    }

}
