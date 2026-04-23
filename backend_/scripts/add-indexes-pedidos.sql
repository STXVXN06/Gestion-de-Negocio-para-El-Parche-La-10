-- Ejecutar una vez en MySQL (ajusta el nombre de BD si aplica).
-- Mejora listados filtrados por estado/fecha y agregaciones de estadísticas.
-- Si aparece error de nombre duplicado, el índice ya existe.

USE parche_la_10_bd;

ALTER TABLE pedidos ADD INDEX idx_pedidos_estado_fecha (estado, fecha);
