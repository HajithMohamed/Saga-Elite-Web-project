# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Development: cookies & tracking-prevention

- When developing locally the browser may block cookies/storage ("Tracking Prevention" or similar privacy features). If your login/check-auth requests return 401 even after successful login, this is commonly caused by cookies not being stored or sent.
- Recommendations:
	- Use the Vite dev proxy so front-end requests are same-origin (calls to `/api` are proxied to the backend).
	- Prefer `localhost` hostnames in development (the project default now uses `http://localhost:5001`) so cookies set for `localhost` are accepted by the browser.
	- If you must use different origins, set cookies with `SameSite=None` and `Secure` and run over HTTPS (browsers require `Secure` for cross-site cookies).
	- For quick debugging, try a different browser or a fresh profile, or temporarily relax Tracking Prevention to confirm cookie-related issues.

These steps resolve most 401 issues caused by cookie/storage blocking during local development.
