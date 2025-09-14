// En UseWebSocket.js
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const useWebSocket = (onMessage) => {
    const clientRef = useRef(null);

    useEffect(() => {
        console.log("Iniciando conexión WebSocket...");
        
        const socket = new SockJS('http://localhost:9090/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            onConnect: () => {
                console.log("Conectado al WebSocket");
                stompClient.subscribe('/topic/nuevos-pedidos', (message) => {
                    console.log("Mensaje recibido:", message.body);
                    try {
                        const parsedMessage = JSON.parse(message.body);
                        onMessage(parsedMessage);
                    } catch (error) {
                        console.error("Error parsing message:", error);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Error de STOMP: ' + frame.headers['message']);
                console.error('Detalles: ' + frame.body);
            },
            onWebSocketClose: () => {
                console.log("WebSocket cerrado");
            },
            onWebSocketError: (error) => {
                console.error("Error de WebSocket:", error);
            }
        });

        stompClient.activate();
        clientRef.current = stompClient;

        return () => {
            console.log("Desconectando WebSocket...");
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [onMessage]);

    return clientRef;
};

export default useWebSocket;