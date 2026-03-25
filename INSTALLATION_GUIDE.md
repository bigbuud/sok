# Installation & Build Guide

## Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- npm 10+ (comes with Node.js)
- Docker (optional, for containerized builds)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open http://localhost:8080 in your browser.

### 3. Build for Production
```bash
npm run build
```
Output will be in the `dist/` directory.

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview production build locally |

---

## 🐳 Docker Build

### Build Docker Image
```bash
docker build -t sok-app:latest .
```

### Run Docker Container
```bash
docker run -p 80:8080 sok-app:latest
```
Access at http://localhost:8080

### Using Docker Compose
```bash
docker-compose up --build
```

---

## 📦 Project Structure

```
sok-main/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── dist/              # Build output (generated)
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose config
├── package.json       # Dependencies
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── tailwind.config.ts # Tailwind CSS configuration
```

---

## 🔧 Configuration Files

### TypeScript
- `tsconfig.json` - Main TypeScript config
- `tsconfig.app.json` - App-specific config
- `tsconfig.node.json` - Node.js tools config

### Build & Dev
- `vite.config.ts` - Vite build config
- `vitest.config.ts` - Vitest testing config
- `playwright.config.ts` - E2E testing config

### Styling & Linting
- `tailwind.config.ts` - Tailwind CSS config
- `postcss.config.js` - PostCSS config
- `eslint.config.js` - ESLint rules

---

## 🎨 Tech Stack

- **Framework:** React 18.3
- **Build Tool:** Vite 5.4
- **Styling:** Tailwind CSS 3.4
- **UI Components:** Shadcn/ui (Radix UI)
- **Forms:** React Hook Form
- **Validation:** Zod
- **Data Fetching:** TanStack Query
- **Routing:** React Router v6
- **Testing:** Vitest
- **E2E Testing:** Playwright
- **Linting:** ESLint 9

---

## ✨ Features

- ✅ Modern React with TypeScript
- ✅ Fast Vite build system
- ✅ Tailwind CSS for styling
- ✅ Shadcn/ui components
- ✅ Dark mode support (next-themes)
- ✅ PWA support (vite-plugin-pwa)
- ✅ Hot module reload (HMR)
- ✅ Unit & E2E testing setup

---

## 🐛 Troubleshooting

### "npm install" hangs or fails
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and reinstall
rm package-lock.json
npm install
```

### Port 8080 already in use
```bash
# Use different port
npm run dev -- --port 3000
```

### Build fails with "out of memory"
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Linting errors
```bash
# Fix auto-fixable issues
npx eslint . --fix
```

---

## 🚀 Deployment

### GitHub Container Registry (GHCR)
The project includes GitHub Actions workflow (`docker-publish.yml`) that:
1. Runs linting and tests
2. Builds Docker image
3. Pushes to GitHub Container Registry automatically

Workflow triggers on:
- Push to `main` branch
- Tags matching `v*` (versions)
- Pull requests to `main`

### Vercel / Netlify
Deploy the built `dist/` folder directly:
```bash
npm run build
# Deploy the dist/ folder
```

### Traditional Server
1. Build the app: `npm run build`
2. Copy `dist/` to your server
3. Serve with nginx/Apache as static files
4. Configure server to redirect all routes to `index.html`

---

## 📚 Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/)

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review the [BUILD_FIXES.md](./BUILD_FIXES.md) document
3. Check GitHub Issues
4. Open a new issue with detailed information

---

**Happy coding! 🎉**
