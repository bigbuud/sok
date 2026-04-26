# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: production server ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install only production deps (express + better-sqlite3)
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend and server
COPY --from=build /app/dist ./dist
COPY server ./server

# Data volume for SQLite
VOLUME ["/data"]

EXPOSE 3000
CMD ["node", "server/index.cjs"]
