# SOK — Reken oefeningen app
Een interactieve web-app voor rekenoefeningen, gebouwd met React + Vite.

---

## 🚀 Installatie op NAS (Docker)

**1. Maak een `docker-compose.yml` aan**

```yaml
services:
  sok:
    image: ghcr.io/bigbuud/sok:latest
    container_name: sok
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - sok_data:/data
    environment:
      - DB_PATH=/data/sok.db
      - PORT=3000
      - TZ=Europe/Brussels

volumes:
  sok_data:
```

> Wil je een andere poort? Pas de linkerkant aan, bv. `5505:3000`.

**2. Start de app**

```bash
docker-compose up -d
```

De app is bereikbaar op **http://NAS-IP:3000**

---

## 🛠 Lokale ontwikkeling

```bash
git clone https://github.com/bigbuud/sok.git
cd sok
npm install
npm run dev
```

---

## 📦 Builden

```bash
npm run build
```
