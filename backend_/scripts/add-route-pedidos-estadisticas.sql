-- Ejecutar en la base parche_la_10_bd (ajusta nombres de columnas/tablas si en tu BD difieren).
-- Tabla routes: columnas típicas id, path, method (ver entidad Route.java).
-- Tabla routes_roles: route_id, role_id (muchos a muchos rutas ↔ roles).

INSERT INTO routes (path, method) VALUES ('/api/pedidos/estadisticas', 'GET');

SET @rid_estadisticas = LAST_INSERT_ID();

INSERT INTO routes_roles (route_id, role_id)
SELECT @rid_estadisticas, rr.role_id
FROM routes r
INNER JOIN routes_roles rr ON rr.route_id = r.id
WHERE r.path = '/api/pedidos' AND r.method = 'GET';
