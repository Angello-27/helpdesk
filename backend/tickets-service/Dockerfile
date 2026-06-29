FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache)
COPY package*.json ./
RUN npm install

# Copiar el resto del código (en dev, src se monta como volumen)
COPY . .

# Worker NATS puro: no expone HTTP (la superficie HTTP la tiene api-gateway).

# El docker-compose sobreescribe el command con start:dev
CMD ["npm", "run", "start:dev"]
