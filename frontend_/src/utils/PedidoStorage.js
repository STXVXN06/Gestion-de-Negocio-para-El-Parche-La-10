// utils/pedidoStorage.js
const PEDIDO_STORAGE_KEY = 'pedidoEnCurso';
const PEDIDO_TIMESTAMP_KEY = 'pedidoTimestamp';
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 horas

export const guardarPedidoEnCurso = (pedidoData) => {
    try {
        const pedidoConTimestamp = {
            ...pedidoData,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(pedidoConTimestamp));
        localStorage.setItem(PEDIDO_TIMESTAMP_KEY, new Date().getTime().toString());
        return true;
    } catch (error) {
        console.error("Error guardando pedido:", error);
        return false;
    }
};

export const obtenerPedidoEnCurso = () => {
    try {
        const pedidoGuardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
        const timestamp = localStorage.getItem(PEDIDO_TIMESTAMP_KEY);

        if (!pedidoGuardado || !timestamp) return null;

        // Verificar si el pedido es muy viejo
        const ahora = new Date().getTime();
        if (ahora - parseInt(timestamp) > MAX_AGE_MS) {
            limpiarPedidoEnCurso();
            return null;
        }

        return JSON.parse(pedidoGuardado);
    } catch (error) {
        console.error("Error obteniendo pedido:", error);
        return null;
    }
};

export const limpiarPedidoEnCurso = () => {
    try {
        localStorage.removeItem(PEDIDO_STORAGE_KEY);
        localStorage.removeItem(PEDIDO_TIMESTAMP_KEY);
        return true;
    } catch (error) {
        console.error("Error limpiando pedido:", error);
        return false;
    }
};

export const hayPedidoEnCurso = () => {
    try {
        const timestamp = localStorage.getItem(PEDIDO_TIMESTAMP_KEY);
        if (!timestamp) return false;

        // Verificar que no sea demasiado viejo
        const ahora = new Date().getTime();
        return (ahora - parseInt(timestamp)) <= MAX_AGE_MS;
    } catch (error) {
        console.error("Error verificando pedido:", error);
        return false;
    }
};