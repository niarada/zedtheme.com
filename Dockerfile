FROM oven/bun:alpine
ENV NODE_ENV=production
RUN apk update && apk add git
COPY . .
RUN bun i
CMD bunx remedy
