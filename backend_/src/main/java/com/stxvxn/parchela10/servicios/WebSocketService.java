package com.stxvxn.parchela10.servicios;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.DTO.PedidoResumenDTO;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void enviarNotificacionNuevoPedido(PedidoResumenDTO resumen) {
        try {
            Map<String, Object> mensaje = new LinkedHashMap<>();
            mensaje.put("tipo", "NUEVO_PEDIDO");
            mensaje.put("mensaje", "Nuevo pedido #" + resumen.getId());
            mensaje.put("pedido", resumen);

            messagingTemplate.convertAndSend("/topic/nuevos-pedidos", mensaje);
            System.out.println("Notificación enviada (pedido " + resumen.getId() + ")");
        } catch (Exception e) {
            System.err.println("Error enviando notificación: " + e.getMessage());
            e.printStackTrace();
        }
    }
}