import { useCallback, useMemo, useRef, useState } from 'react';
import api from '../api';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeEstado(estado) {
  if (!estado || estado === 'todos') return undefined;
  return estado;
}

function matchesEstadoFilter(pedidoEstado, estadoFiltro) {
  if (!estadoFiltro || estadoFiltro === 'todos') return true;
  return pedidoEstado === estadoFiltro;
}

/** `pedidoFecha`: ISO string o valor parseable por Date. `desde`/`hasta`: YYYY-MM-DD o undefined (fecha local). */
function pedidoFechaEnRango(pedidoFecha, desde, hasta) {
  if (!desde && !hasta) return true;
  const d = new Date(pedidoFecha);
  if (Number.isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const ymd = `${y}-${m}-${day}`;
  if (desde && ymd < desde) return false;
  if (hasta && ymd > hasta) return false;
  return true;
}

function toIsoDateParam(momentOrDayjs) {
  if (!momentOrDayjs) return undefined;
  // moment & dayjs compatible
  return momentOrDayjs.format('YYYY-MM-DD');
}

export default function usePedidosPaginados({ pageSizeDefault = 20 } = {}) {
  const [page, setPage] = useState(0); // 0-based (Spring)
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [estado, setEstado] = useState('todos');
  const [rangoFechas, setRangoFechas] = useState(null); // [start, end] moment objects

  const [items, setItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const [estadisticas, setEstadisticas] = useState({
    entregados: 0,
    pendientes: 0,
    cancelados: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const [detailsById, setDetailsById] = useState({});
  const [loadingDetailById, setLoadingDetailById] = useState({});

  const listReqId = useRef(0);
  const statsReqId = useRef(0);

  const desde = useMemo(() => (rangoFechas?.[0] ? toIsoDateParam(rangoFechas[0]) : undefined), [rangoFechas]);
  const hasta = useMemo(() => (rangoFechas?.[1] ? toIsoDateParam(rangoFechas[1]) : undefined), [rangoFechas]);

  const listParams = useMemo(
    () => ({
      page,
      size: pageSize,
      estado: normalizeEstado(estado),
      desde,
      hasta,
    }),
    [page, pageSize, estado, desde, hasta]
  );

  const statsParams = useMemo(
    () => ({
      desde,
      hasta,
    }),
    [desde, hasta]
  );

  const fetchList = useCallback(async () => {
    const rid = ++listReqId.current;
    setLoadingList(true);
    try {
      const res = await api.get('/api/pedidos', { params: listParams });
      if (rid !== listReqId.current) return;
      const data = res.data;
      setItems(Array.isArray(data?.content) ? data.content : []);
      setTotalElements(typeof data?.totalElements === 'number' ? data.totalElements : 0);
    } finally {
      if (rid === listReqId.current) setLoadingList(false);
    }
  }, [listParams]);

  const fetchStats = useCallback(async () => {
    const rid = ++statsReqId.current;
    setLoadingStats(true);
    try {
      const res = await api.get('/api/pedidos/estadisticas', { params: statsParams });
      if (rid !== statsReqId.current) return;
      setEstadisticas({
        entregados: res.data?.entregados ?? 0,
        pendientes: res.data?.pendientes ?? 0,
        cancelados: res.data?.cancelados ?? 0,
      });
    } finally {
      if (rid === statsReqId.current) setLoadingStats(false);
    }
  }, [statsParams]);

  const ensureDetail = useCallback(
    async (pedidoId) => {
      const id = Number(pedidoId);
      if (!id || Number.isNaN(id)) return null;
      if (detailsById[id]) return detailsById[id];
      if (loadingDetailById[id]) return null;

      setLoadingDetailById((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await api.get(`/api/pedidos/${id}`);
        setDetailsById((prev) => ({ ...prev, [id]: res.data }));
        return res.data;
      } finally {
        setLoadingDetailById((prev) => ({ ...prev, [id]: false }));
      }
    },
    [detailsById, loadingDetailById]
  );

  const setPageSafe = useCallback(
    (nextPage) => {
      setPage(clamp(Number(nextPage) || 0, 0, Number.MAX_SAFE_INTEGER));
    },
    [setPage]
  );

  const setPageSizeSafe = useCallback(
    (nextSize) => {
      const s = clamp(Number(nextSize) || pageSizeDefault, 1, 100);
      setPageSize(s);
      setPage(0);
    },
    [pageSizeDefault]
  );

  const resetToFirstPage = useCallback(() => setPage(0), []);

  const tryPrependNuevoPedido = useCallback(
    (pedido) => {
      if (!pedido || pedido.id == null) return false;
      if (page !== 0) return false;
      if (!matchesEstadoFilter(pedido.estado, estado)) return false;
      if (!pedidoFechaEnRango(pedido.fecha, desde, hasta)) return false;

      let inserted = false;
      setItems((prev) => {
        const id = Number(pedido.id);
        if (prev.some((p) => Number(p.id) === id)) {
          return prev;
        }
        inserted = true;
        const next = [pedido, ...prev.filter((p) => Number(p.id) !== id)];
        return next.slice(0, pageSize);
      });
      if (inserted) {
        setTotalElements((t) => t + 1);
      }
      return inserted;
    },
    [page, estado, desde, hasta, pageSize]
  );

  return {
    // state
    page,
    pageSize,
    totalElements,
    estado,
    rangoFechas,
    items,
    estadisticas,
    detailsById,
    loadingList,
    loadingStats,
    loadingDetailById,

    // derived params (for debugging/telemetry if needed)
    desde,
    hasta,

    // actions
    setEstado: (next) => {
      setEstado(next ?? 'todos');
      setPage(0);
    },
    setRangoFechas: (next) => {
      setRangoFechas(next);
      setPage(0);
    },
    setPage: setPageSafe,
    setPageSize: setPageSizeSafe,
    resetToFirstPage,
    fetchList,
    fetchStats,
    ensureDetail,
    tryPrependNuevoPedido,
  };
}

