# nhl-stats-vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Auth + Premium Setup (Google + Email/Password + One-time Code)

This project now includes:
- Login with Google OAuth
- Login/signup with email + password
- Premium activation with one-time code tied to user email
- Feature locking for non-premium users

### 1) Configure environment

Copy `.env.example` to `.env.local` and fill values:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 2) Apply database migration

Run the SQL migration in your Supabase project:

`supabase/migrations/20260327_auth_premium.sql`
`supabase/migrations/20260329_premium_codes_optional_email.sql`

It creates:
- `profiles` table (premium status)
- `premium_codes` table (email-linked one-time codes)
- `redeem_premium_code(input_code text)` RPC function
- RLS policies and permissions

### 3) Configure Google provider

In Supabase Auth settings:
- Enable Google provider
- Add your app URL to redirect allow-list

### 4) Insert one-time premium codes (admin)

Use the SQL example at the bottom of migration file.
Codes are stored as SHA-256 hash, not plain text.

Code modes supported:
- Email-bound one-time code (`email` filled)
- Open one-time code (`email` = `NULL`, redeemable once by any authenticated user)
