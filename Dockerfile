FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN ls && npm run build


FROM node:16-alpine

LABEL org.opencontainers.image.source = "https://github.com/nick-lehmann/notion-films"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist dist

ENTRYPOINT ["npm", "run"]
CMD [ "start" ]