# Trivia Ruleta

Juego web de trivia por turnos para varios jugadores en un mismo dispositivo. Cada turno se gira una ruleta que define la categoría y la dificultad (1, 2, 3, 5 u 8 puntos) de la pregunta.

## Requisitos

- Node 22+
- pnpm

## Scripts

```bash
pnpm install
pnpm dev       # servidor de desarrollo
pnpm test      # tests (Vitest)
pnpm lint      # oxlint
pnpm build     # build de producción en dist/
```

## Deploy

Cada push a `main` ejecuta `.github/workflows/deploy.yml`: instala, corre lint y tests, construye y publica `dist/` en GitHub Pages. En el repositorio hay que activar **Settings → Pages → Source: GitHub Actions**.

## Cómo se juega

- Cada ronda, cada jugador gira la ruleta una vez.
- Cada casilla trae una regla de categoría y una de dificultad: **fija**, **libre** (eliges entre todas) o **elige k** (al caer se sortean k opciones habilitadas).
- Acertar suma los puntos de la dificultad (1, 2, 3, 5 u 8). Fallar o quedarse sin tiempo no suma.
- Las preguntas no se repiten en una partida. Si hay empate al final, se resuelve según lo elegido al configurar: victoria compartida o muerte súbita.
