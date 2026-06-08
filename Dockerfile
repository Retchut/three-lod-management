FROM node:26-alpine3.22 AS builder
WORKDIR /app/
RUN apk add --no-cache curl unzip
COPY package.json package-lock.json tsconfig.json .prettierrc ./
RUN npm install
COPY scripts/ ./scripts
COPY src/ ./src
COPY public ./public
COPY index.html ./
RUN chmod +x scripts/fetchModels.sh
RUN npm run build

FROM nginx:1.31.1-alpine-slim
COPY --from=builder /app/dist /usr/share/nginx/html
expose 80
CMD ["nginx", "-g", "daemon off;"]