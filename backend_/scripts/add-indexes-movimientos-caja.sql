-- Ejecutar una vez en MySQL (ajusta el nombre de BD si aplica).
-- Mejora listados paginados con filtro por fecha/tipo y orden por fecha.
-- Si aparece error de nombre duplicado, el índice ya existe.

USE parche_la_10_bd;

ALTER TABLE movimientos_caja ADD INDEX idx_mov_caja_fecha (fecha);
ALTER TABLE movimientos_caja ADD INDEX idx_mov_caja_tipo_fecha (tipo, fecha);
