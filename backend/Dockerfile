FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/seed-data ./dist/seed-data
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
