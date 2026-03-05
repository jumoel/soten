# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Soten** is a minimal web-based Markdown note editor. Notes are stored in GitHub repositories and accessed via in-browser Git operations. There is no traditional backend — Git runs entirely in the browser using isomorphic-git with an IndexedDB-backed filesystem (LightningFS).

## Environment Setup

The required Node.js version is specified in `.node-version` (currently 24). Use a version manager
(e.g. `fnm`, `nvm`) to ensure the correct version is active before doing anything else.

Install dependencies with:

```sh
npm ci
```

Always use `npm ci` (not `npm install`) to ensure a clean, reproducible install from `package-lock.json`.

## Development Workflow

Two terminals are required to run the app locally:

```sh
npm run dev         # Vite dev server (frontend, port 5173)
npm run dev:proxy   # Wrangler Pages dev server (Cloudflare Workers, port 8788)
```

Vite proxies `/api` requests to port 8788 in development.

## Quality Checks

There is no test framework. Quality is enforced via:

```sh
npm run lint    # ESLint
npm run style   # Prettier (format check only, does not write)
npm run types   # TypeScript type check (tsc --noEmit)
npm run build   # Vite production build
```

All four checks run in CI on every push. **All checks must pass before committing or pushing.**
Run them locally before every commit.

## Architecture

### Frontend (`src/`)

| File/Dir               | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `src/index.tsx`        | React entry point                                          |
| `src/app.tsx`          | Root component — renders auth UI, file list, note view     |
| `src/index.css`        | Tailwind CSS imports only                                  |
| `src/markdown.ts`      | Unified.js pipeline: Markdown → HTML + frontmatter         |
| `src/atoms/globals.ts` | All Jotai atoms, app state enums, and event dispatch logic |
| `src/lib/git.ts`       | isomorphic-git wrapper (clone, pull, user config)          |
| `src/lib/fs.ts`        | LightningFS wrapper (read files, wipe IndexedDB)           |
| `src/lib/github.ts`    | GitHub OAuth redirect and REST API calls                   |
| `src/lib/config.ts`    | localStorage helpers                                       |
| `src/components/`      | Small UI components                                        |

### Backend (`functions/`)

Cloudflare Workers functions serving the `/api` routes:

| File                                    | Purpose                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `functions/api/cors-proxy/[[proxy]].js` | CORS proxy for isomorphic-git HTTP requests                               |
| `functions/api/gh-auth/callback.js`     | GitHub OAuth callback — exchanges code for token, checks app installation |

### State Management

State lives in `src/atoms/globals.ts` using **Jotai**. The pattern is a central event dispatch system with typed discriminated unions — similar to Redux but without reducers. Dispatch is async and supports chaining.

Key enums: `AppState`, `AuthState`, `AppView`.

### Routing

Hash-based client-side routing:

- `#/` → front/home view
- `#/path/to/file` → note view

A `hashchange` listener drives navigation.

## Key Conventions

### TypeScript

- Strict mode is enabled (`tsconfig.json`)
- `noUnusedLocals` and `noUnusedParameters` are enforced — remove unused code, do not prefix with `_`
- React 19 JSX transform is used — do not import React in component files
- Module resolution is `bundler` mode

### Code Style

- Prettier print width: **100 characters**
- ESLint uses the flat config format (`eslint.config.mjs`)
- Do not add unnecessary comments or JSDoc — the codebase is intentionally lean

### UI Design

Follow a Tufte-inspired aesthetic: maximise information density, but allow restrained visual chrome — things should be nice to look at, not merely efficient.

- **Density first** — prefer tight padding (`px-4 py-3`, `gap-3`) over generous spacing; content should be readable, not airy
- **Restrained chrome is welcome** — subtle borders, gentle rounding (`rounded`), and off-white surfaces improve legibility and visual comfort; avoid heavy shadows, animations, and ornament that competes with content
- **Typography over boxes** — establish hierarchy through font weight, size, and small-caps labels rather than heavy containers
- **Hairline rules with a strong accent** — thin (`border` / 1px) perimeter in light gray (`border-gray-200`) combined with a single stronger left-edge accent (e.g. `border-l-[3px] border-l-gray-400`) gives cards definition without visual noise
- **Off-white backgrounds** — `bg-gray-50` is the preferred card/surface background; it is distinct from the page without introducing colour
- **Muted, purposeful colour** — grays are preferred; colour should carry meaning, not decoration

#### Design System Components

When building new UI, compose from design system components in `src/components/ds/` and existing components in `src/components/`. Do not write raw Tailwind class strings for patterns that already have a component. If a new pattern is needed, add a ds/ component first, then use it. Never introduce colours outside the palette below.

| Component                  | Purpose                           | When to use                              |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| `ds/Card`                  | Surface with left accent border   | Content cards, list items, visual weight |
| `ds/Stack`                 | Vertical flex layout              | Spacing groups of elements vertically    |
| `ds/DividedList`           | List with hairline dividers       | Simple text lists (nav, settings)        |
| `ds/TextInput`             | Styled form input                 | Any text/number input field              |
| `ds/Toolbar`               | Horizontal bar with bottom border | Top bars, action bars                    |
| `ds/Text`                  | Typographic rhythm                | All text rendering (see variants below)  |
| `components/Button`        | Interactive button                | Actions (primary, link, ghost variants)  |
| `components/AlertBox`      | Error/warning container           | Error states, warnings                   |
| `components/PageContainer` | Max-width centered container      | Page content wrapper                     |
| `components/ProseContent`  | Rendered markdown                 | Markdown HTML output                     |
| `components/BackLink`      | Navigation back link              | Back navigation                          |

#### Text Variants (`ds/Text`)

The `Text` component accepts a `variant` prop and an optional `as` prop to override the HTML element. All text should use `Text` rather than raw elements with inline classes.

| Variant        | Default element | Classes                                                       | Use for                                |
| -------------- | --------------- | ------------------------------------------------------------- | -------------------------------------- |
| `body`         | `p`             | `text-sm text-gray-700`                                       | Default body text                      |
| `secondary`    | `p`             | `text-sm text-gray-500`                                       | Pagination, table values, support text |
| `meta`         | `span`          | `text-xs text-gray-400 uppercase tracking-widest`             | Dates, categories, tertiary labels     |
| `mono`         | `code`          | `font-mono text-sm text-gray-500`                             | Repo names, paths, config values       |
| `label`        | `label`         | `block text-sm font-semibold text-gray-700`                   | Form labels                            |
| `sectionLabel` | `h3`            | `text-xs font-semibold uppercase tracking-wide text-gray-500` | Section headings above groups          |
| `error`        | `p`             | `text-red-700 font-medium`                                    | Error headings                         |
| `errorDetail`  | `pre`           | `text-sm text-red-600 whitespace-pre-wrap`                    | Error details, stack traces            |
| `title`        | `h1`            | `text-2xl font-semibold text-gray-800`                        | Page titles                            |
| `heading`      | `h2`            | `text-lg font-medium tracking-tight text-gray-800`            | Section headings                       |

#### Colour Palette

Five grays, two reds — nothing else.

**Surfaces:**

- `bg-gray-100` — page background
- `bg-white` — primary card surface
- `bg-gray-50` — muted card surface
- `bg-red-50` — error surface

**Text** (four stops):

- `text-gray-800` — headings, titles (darkest)
- `text-gray-700` — body text, labels
- `text-gray-500` — secondary text, section labels, mono values
- `text-gray-400` — meta labels, tertiary (lightest)
- `text-red-700` — error headings
- `text-red-600` — error detail
- `text-white` — on dark buttons only

**Borders:**

- `border-gray-200` — standard borders, dividers
- `border-gray-300` — input borders (slightly stronger for affordance)
- `border-red-200` — error borders

**Accents:**

- `border-l-gray-400` — card left accent (resting)
- `border-l-gray-600` — card left accent (hover)

**Interactive fills:**

- `bg-gray-700` — primary button
- `hover:bg-gray-600` — primary button hover

### File System

- The browser filesystem is IndexedDB-backed (LightningFS)
- Hidden files and directories (names starting with `.`) are excluded from file listings
- Supported image formats: jpg, png, gif, webp, svg, bmp, ico
- `wipeFs()` in `src/lib/fs.ts` clears the entire IndexedDB database

### Error Handling

- Functions that can fail silently return `null` rather than throwing
- Console logging is used for debug output (git `onMessage`/`onProgress` callbacks)
- Do not add broad try/catch blocks — match the existing pattern

### Cloudflare Workers

- Workers are plain JavaScript (not TypeScript)
- The CORS proxy whitelists specific headers — update the allowlist in `functions/api/cors-proxy/[[proxy]].js` if new Git headers are needed
- Deployment config is in `wrangler.toml`; build output goes to `dist/`

## Dependencies

Notable production dependencies:

| Package                           | Role                                    |
| --------------------------------- | --------------------------------------- |
| `react` / `react-dom`             | UI framework                            |
| `jotai`                           | Atomic state management                 |
| `isomorphic-git`                  | In-browser Git                          |
| `@isomorphic-git/lightning-fs`    | IndexedDB filesystem for isomorphic-git |
| `unified`, `remark-*`, `rehype-*` | Markdown processing pipeline            |
| `vfile-matter`                    | YAML frontmatter extraction             |
| `buffer`                          | Node.js Buffer polyfill for the browser |
| `@total-typescript/ts-reset`      | TypeScript type improvements            |

## Git Commit Conventions

Use semantic commit messages with a type prefix:

| Type       | When to use                                  |
| ---------- | -------------------------------------------- |
| `feat`     | New feature or user-visible capability       |
| `fix`      | Bug fix                                      |
| `refactor` | Code restructuring with no behaviour change  |
| `chore`    | Maintenance — deps, config, tooling, cleanup |
| `docs`     | Documentation only                           |
| `style`    | Formatting only (Prettier, whitespace, etc.) |
| `test`     | Test additions or changes                    |

Format: `<type>(<optional scope>): <short description>`

Examples:

- `feat: add keyboard shortcut to save note`
- `fix: prevent duplicate clone on fast navigation`
- `chore(deps): bump vite from 6.3.4 to 6.3.5`
- `refactor(atoms): split globals.ts into focused modules`

Additional rules:

- Keep the subject line under 72 characters
- Use the imperative mood ("add", "fix", "remove" — not "added", "fixes")
- Do not include links to claude.ai in commit messages or PR descriptions
- Use only the `Co-authored-by: Claude <noreply@anthropic.com>` git trailer on AI-authored commits (commit messages only — omit from PR descriptions)

## Pull Request Descriptions

Structure PR descriptions with these sections:

**What** — executive summary of what changed. No file listings or implementation details.

**Why** — the reasoning behind the change. Why is it necessary?

**Details** — optional. Include only if implementation details are truly necessary to understand the change.

Example:

```
## What
Added CLAUDE.md documenting the codebase for AI assistants.

## Why
Without this file, AI assistants lack context about project conventions,
tooling, and architecture, leading to inconsistent contributions.

## Details
The dispatch chain parameter was also removed as it was unused and
caused lint/type failures.
```

## CI/CD

- **Primary branch**: `main`
- **GitHub Actions** (`.github/workflows/checks.yml`): runs `lint`, `types`, `style`, `build` in parallel on every push
- **CodeQL** (`.github/workflows/codeql.yml`): security scanning on push to `main` and PRs, plus weekly schedule
- **Dependabot**: weekly NPM updates, monthly Actions updates
- **Deployment**: Cloudflare Pages via `wrangler`
