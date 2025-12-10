FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app
COPY package.json .
COPY node_modules node_modules
COPY shared shared
COPY backend backend

WORKDIR /app/backend

CMD ["src/index.js"]