# Browser Agent — Node API + static UI
# Visible Chrome should run on the host. Attach with CHROME_BROWSER_URL=http://host.docker.internal:9222

FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=8820
ENV DATA_DIR=/app/data

EXPOSE 8820

VOLUME ["/app/data"]

CMD ["node", "dist/server/index.js"]
