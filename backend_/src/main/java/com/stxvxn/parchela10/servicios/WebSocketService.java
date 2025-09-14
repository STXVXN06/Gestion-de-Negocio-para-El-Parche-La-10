package com.stxvxn.parchela10.servicios;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void enviarNotificacionNuevoPedido() {
        try {
            Map<String, String> mensaje = Map.of(
                    "tipo", "NUEVO_PEDIDO",
                    "mensaje", "Un empleado ha creado un nuevo pedido");

            messagingTemplate.convertAndSend("/topic/nuevos-pedidos", mensaje);
            System.out.println("Notificación enviada: " + mensaje);
        } catch (Exception e) {
            System.err.println("Error enviando notificación: " + e.getMessage());
            e.printStackTrace();
        }
    }
}