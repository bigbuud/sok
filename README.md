# SOK — Reken oefeningen app

Een interactieve web-app voor rekenoefeningen, gebouwd met React + Vite.

---

## 🚀 Installatie op NAS (Docker)

**1. Maak een mapje aan op je NAS**

```bash
mkdir -p /volume1/docker/sok/logs
```

> QNAP: gebruik `/share/Container/sok/logs`

**2. Maak een `docker-compose.yml` aan**

```yaml
services:
  sok:
    image: ghcr.io/bigbuud/sok:latest
    container_name: sok
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - /volume1/docker/sok/logs:/var/log/nginx
    environment:
      - TZ=Europe/Brussels
```

**3. Start de app**

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
