# Usa Node LTS
FROM node:20-alpine AS build

WORKDIR /app

# Copia archivos de dependencias
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm ci --silent

# Copia el resto de archivos
COPY . .

# Construye la aplicación
RUN npm run build

# Etapa final con Nginx
FROM nginx:alpine 
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]