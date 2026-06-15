FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001
ARG VITE_SAME_ORIGIN_API=true
ARG VITE_SITE_URL=https://www.erzurumtb.org.tr
ARG VITE_ALLOW_INDEXING=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SAME_ORIGIN_API=$VITE_SAME_ORIGIN_API
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_ALLOW_INDEXING=$VITE_ALLOW_INDEXING
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
