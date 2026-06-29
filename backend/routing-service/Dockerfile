FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache)
COPY package*.json ./
RUN npm install

# Copiar el resto del código (en dev, src se monta como volumen)
COPY . .

EXPOSE 3000

# El docker-compose sobreescribe el command con start:dev
CMD ["npm", "run", "start:dev"]
