# Flowly — AI-assisted workflow workspace

A responsive SaaS landing page with working sign up / sign in, a protected workspace, and a demo request form.
Built for the Sankar Group front-end internship assignment.

## Features

**Landing page**
- Sticky navigation with active-section highlighting, mobile menu, and light/dark theme switch
- Sign in / Create account window that opens when the site first loads (can be skipped)
- Hero with an animated workflow preview, typing AI prompt and user avatars
- Animated stats, feature cards that open preview windows
- Product tour: switch between Board, Timeline and Insights screenshots
- **Try the AI builder**: type a process (or tap an example) and get a step-by-step workflow
- How it works with illustrations, rotating testimonials
- Pricing with monthly/yearly toggle, plus a savings calculator with sliders
- FAQ accordion, demo request form, newsletter signup, toast notifications, back-to-top button

**Accounts and workspace**
- Create account with password strength meter, show/hide password and terms check
- Sign in, sign out, and a signed-in menu in the navigation
- Protected workspace page (redirects to sign in if you're signed out)
- Kanban board: add tasks, drag between columns, rename (double-click), move with buttons, delete

**Forms**
- Client-side validation with clear error messages, server-side validation, loading spinners and success messages

## Two ways it runs — both work without errors

| Mode | When | Where data is saved |
|---|---|---|
| **Full stack** | Running `npm start` (Node server) | `data/db.json` on the server |
| **Static** | Opening `public/index.html` directly, or hosting only the `public/` folder (Netlify, GitHub Pages, Manus) | The visitor's browser (localStorage) |

The front end checks for the API automatically (`/api/health`). If no server responds, it switches to browser storage,
so the contact form, sign up, sign in and workspace still work.

## Run locally (full stack)

Requirements: Node.js 18 or newer.

```bash
npm install
cp .env.example .env      # then set JWT_SECRET to a long random string
npm start                 # open http://localhost:3000
```

Use `npm run dev` to restart automatically on code changes.

## Deploy on Render (full stack, free)

1. Push this folder to a GitHub repository.
2. On render.com: **New + → Blueprint**, pick the repository. `render.yaml` sets everything up,
   including a random `JWT_SECRET`.
   (Or **New + → Web Service** with build command `npm install`, start command `npm start`,
   and environment variables `NODE_ENV=production` and `JWT_SECRET=<long random string>`.)
3. Open the `onrender.com` link Render gives you.

Notes for the free plan: the server sleeps after about 15 minutes without visits, so the first load can take
up to a minute. The JSON database file is reset when the service restarts or redeploys; for permanent data,
add a Render disk or switch `server/db.js` to a hosted database.

## Run without a backend

Open `public/index.html` in a browser, or upload the `public/` folder to any static host.

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Server check |
| POST | `/api/auth/register` | – | Create account (name, email, password) |
| POST | `/api/auth/login` | – | Sign in |
| POST | `/api/auth/logout` | – | Sign out |
| GET | `/api/auth/me` | – | Current user, or `null` |
| GET / POST | `/api/tasks` | ✓ | List / add tasks |
| PATCH / DELETE | `/api/tasks/:id` | ✓ | Update / delete a task |
| POST | `/api/demo` | – | Save a demo request message |

Passwords are hashed with bcrypt. Sessions use a signed JWT in an httpOnly cookie. Sign-in routes are rate-limited.

## Project structure

```
flowly/
├── public/                 Front end (HTML, CSS, vanilla JS)
│   ├── index.html          Landing page
│   ├── workspace.html      Signed-in workspace
│   ├── css/styles.css
│   ├── js/api.js           API client with automatic browser-storage fallback
│   ├── js/ui.js            Theme, toasts, validation helpers
│   ├── js/main.js          Landing page + sign in / sign up
│   ├── js/features.js      Product tour, AI builder demo, savings calculator
│   ├── js/workspace.js     Kanban board
│   └── images/             SVG product screenshots, illustrations, avatars
├── server/                 Back end (Node.js + Express)
│   ├── server.js           Routes, auth, validation
│   ├── db.js               JSON file database
│   └── env.js              .env loader
├── screenshots/            Desktop and mobile screenshots
├── .env.example
└── package.json
```

## Technologies

HTML5, CSS3 (custom properties, grid, flexbox, `color-mix`), vanilla JavaScript (ES2020),
Node.js, Express 5, bcryptjs, jsonwebtoken, cookie-parser. Fonts: Bricolage Grotesque and DM Sans (Google Fonts).

## Design choices and challenges

Flowly's look is built around one idea: work that moves. The hero shows a live workflow, with a dot travelling between
steps and an AI prompt that types itself, so visitors understand the product before reading. A single cobalt blue drives
every action, with green reserved for "done" and progress. Bricolage Grotesque gives headlines character while DM Sans
keeps body text easy to read. All images are lightweight SVGs, so the page loads fast and stays sharp on any screen.
The main challenge was making sign up, sign in and the contact form work everywhere: the brief needs a static site,
but a real backend was requested too. The API client detects whether the server is available and falls back to browser
storage, so the same code runs with or without a backend and never shows a connection error. Accessibility was handled
with keyboard-friendly modals (focus trap, Escape to close), visible focus rings, ARIA labels and reduced-motion support.
