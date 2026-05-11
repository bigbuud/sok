# 🧮 Rekenmeester

Educatieve reken-app voor kinderen in het eerste leerjaar (Vlaams leerplan).  
Gebouwd met React + TypeScript + Tailwind CSS. Draait als Docker-container op een Synology NAS.

---

## Oefeningen

| Oefening | Beschrijving |
|---|---|
| Splitsingen | Splits getallen van 2 tot 10 in twee delen |
| Splitsingen tot 20 | Splits getallen van 11 tot 20 in twee delen |
| Getallen bouwen | Bouw getallen met tientallen en eenheden |
| Optellen & Aftrekken | Rekenen over de tien (brug) |
| Vermenigvuldigen | Tafels oefenen |
| Delen | Deling oefenen |
| Cijferen | Cijferend optellen en aftrekken met hints |

---

## Technische stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express
- **Data**: JSON-bestand op de server (persistent, per profiel)
- **Container**: Docker (nginx vervangen door Express)
- **CI/CD**: GitHub Actions → GHCR → Portainer

---

## Lokaal draaien

```bash
npm install
npm run dev
```

---

## Docker — zelf bouwen

```bash
docker build -t rekenmeester .
docker run -p 3000:3000 -v $(pwd)/data:/data rekenmeester
```

---

## Deployen op Synology NAS (Portainer)

### 1. Map aanmaken (via SSH)

```bash
mkdir -p /volume1/docker/sok2/data
```

### 2. Stack in Portainer

Ga naar **Stacks → Add stack**, geef het de naam `sok2` en plak onderstaande compose:

```yaml
version: '3.8'

services:
  sok2:
    image: ghcr.io/bigbuud/sok2:latest
    ports:
      - "5505:3000"
    volumes:
      - /volume1/docker/sok2/data:/data
    environment:
      - STATE_FILE=/data/state.json
    restart: unless-stopped
```

De app is bereikbaar op `http://<NAS-IP>:5505`.

### 3. Image updaten

Na een nieuwe push pikt GitHub Actions de wijziging automatisch op en bouwt een nieuwe image.  
In Portainer: **Stacks → sok2 → Editor → Update the stack** met **Re-pull image** aangevinkt.

---

## Data

Scores en profielen worden opgeslagen in `/data/state.json` op de NAS.  
Dit bestand blijft bewaard bij container-herstarts en browser-wissels.

Locatie op NAS: `/volume1/docker/sok2/data/state.json`

---

## CI/CD

GitHub Actions workflow (`.github/workflows/docker-publish.yml`):

1. **Run Tests** — ESLint + Vitest
2. **Build and Push** — Docker image naar `ghcr.io/bigbuud/sok2:latest`
