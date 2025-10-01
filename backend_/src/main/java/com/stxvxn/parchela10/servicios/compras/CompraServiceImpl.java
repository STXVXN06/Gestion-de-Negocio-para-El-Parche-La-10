package com.stxvxn.parchela10.servicios.compras;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.repositorios.CompraRepository;
import com.stxvxn.parchela10.servicios.caja.ICajaService;
import com.stxvxn.parchela10.servicios.caja.IMovimientoCajaService;
import com.stxvxn.parchela10.servicios.compras.estrategias.CompraProcessor;

import lombok.RequiredArgsConstructor;

/**
 * Implementación SOLID del servicio de compras
 * 
 * ✅ SRP: Solo orquesta el flujo de registro de compras, delegando responsabilidades
 * ✅ OCP: Extensible mediante estrategias sin modificar código existente
 * ✅ LSP: Puede sustituirse por cualquier implementación de ICompraService
 * ✅ ISP: Depende solo de interfaces pequeñas y específicas
 * ✅ DIP: Depende de abstracciones, no de implementaciones concretas
 */
@Service
@RequiredArgsConstructor
public class CompraServiceImpl implements ICompraService {

    private final CompraRepository compraRepository;
    private final List<CompraProcessor> compraProcessors; // Inyección de todas las estrategias
    private final IMovimientoCajaService movimientoCajaService;
    private final ICajaService cajaService;

    @Override
    @Transactional
    public Compra registrarCompra(Compra compra) {
        validarCompra(compra);
        
        // Obtener caja actual
        Caja cajaActual = cajaService.obtenerCajaActual()
                .orElseThrow(() -> new IllegalStateException("No hay caja activa para registrar la compra"));

        // Procesar según el tipo usando el patrón Strategy (OCP)
        CompraProcessor processor = obtenerProcesadorAdecuado(compra.getTipo());
        String descripcionMovimiento = processor.procesarCompra(compra);

        // Guardar compra
        Compra compraGuardada = compraRepository.save(compra);

        // Registrar movimiento de caja
        movimientoCajaService.registrarEgresoPorCompra(
                descripcionMovimiento, 
                compra.getCostoTotal(), 
                cajaActual.getId(), 
                compraGuardada
        );

        return compraGuardada;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Compra> obtenerTodasLasCompras() {
        return (List<Compra>) compraRepository.findAll();
    }

    @Override
    @Transactional
    public void anularCompra(Long compraId) {
        Compra compra = compraRepository.findById(compraId)
                .orElseThrow(() -> new IllegalArgumentException("Compra no encontrada con ID: " + compraId));

        // Marcar como anulada (lógica encapsulada en la entidad)
        compra.anular();

        // Eliminar movimiento de caja asociado
        movimientoCajaService.eliminarMovimientosPorCompra(compra.getId());

        // Ajustar monto en caja
        cajaService.ajustarMontoActual(compra.getCostoTotal());

        // Revertir procesamiento específico según tipo
        CompraProcessor processor = obtenerProcesadorAdecuado(compra.getTipo());
        processor.revertirCompra(compra);

        // Guardar cambios
        compraRepository.save(compra);
    }

    // ==================== Métodos Privados ====================

    private void validarCompra(Compra compra) {
        if (compra == null) {
            throw new IllegalArgumentException("La compra no puede ser nula");
        }
        if (compra.getTipo() == null) {
            throw new IllegalArgumentException("El tipo de compra es obligatorio");
        }
        if (compra.getCostoTotal() == null || compra.getCostoTotal() <= 0) {
            throw new IllegalArgumentException("El costo total debe ser mayor a cero");
        }
    }

    /**
     * Obtiene el procesador adecuado según el tipo de compra
     * Aplica OCP: nuevos procesadores se agregan sin modificar este código
     */
    private CompraProcessor obtenerProcesadorAdecuado(Compra.TipoCompra tipo) {
        return compraProcessors.stream()
                .filter(processor -> processor.puedesProcesar(tipo))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No hay procesador disponible para el tipo de compra: " + tipo));
    }
}