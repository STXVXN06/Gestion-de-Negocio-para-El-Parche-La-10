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
        messagingTemplate.convertAndSend("/topic/nuevos-pedidos", 
            Map.of("tipo", "NUEVO_PEDIDO", "mensaje", "Un empleado ha creado un nuevo pedido"));
    }
}