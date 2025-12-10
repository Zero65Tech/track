FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app
COPY package.json package-lock.json ./
COPY node_modules node_modules
COPY shared shared
COPY backend backend

ls -al node_modules

CMD ["backend/src/index.js"]