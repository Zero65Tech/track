FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app
COPY package.json .
COPY node_modules node_modules
COPY shared shared
COPY backend backend

CMD ["backend/src/index.js"]