FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend backend
COPY shared shared

CMD ["backend/src/index.js"]