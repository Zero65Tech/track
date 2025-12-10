# Stage 1: Build

FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend backend
COPY shared shared

RUN npm install --production



# Stage 2: Runtime with Distroless

FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app/backend

COPY --from=build-stage /app /app

CMD ["src/index.js"]