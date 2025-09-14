#!/bin/sh

# Variables
DB_HOST="db"
DB_USER="user"
DB_PASSWORD="root"
DB_NAME="parche_la_10_bd"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Ejecutar mysqldump
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD --single-transaction --routines --triggers $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete