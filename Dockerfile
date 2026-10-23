# Imagen de producción: compila la PWA y la sirve junto con la API desde Node.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787 DATA_DIR=/data
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
# /data es la carpeta prevista; /app/data cubre el caso de DATA_DIR=./data.
RUN mkdir -p /data /app/data && chown node:node /data /app/data
USER node
VOLUME ["/data"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8787/api/health || exit 1
CMD ["node", "server/index.js"]