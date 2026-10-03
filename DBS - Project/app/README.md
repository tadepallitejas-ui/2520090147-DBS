# FitWell — connected app

This is your original frontend (`public/home.html`, `public/login.html`,
`public/styles.css`) wired to a real Express API and MongoDB database. Nothing
in the API server is faked — the login form, "Book Now" buttons, and "My
Bookings" link all talk to real endpoints backed by the schema.

```
Browser (public/home.html, login.html)
   │  fetch('/api/...')
   ▼
Express API (server.js, routes/)
   │  Mongoose
   ▼
MongoDB (models/)
```

## What changed in the frontend

- **login.html** — the fake "always succeeds" submit handler is replaced with
  real `fetch()` calls to `/api/auth/login` and `/api/auth/register` (the
  "Sign Up" link now toggles the form into register mode). On success it
  stores a JWT in `localStorage` and redirects to `home.html`.
- **home.html** —
  - Nav: "Login / Sign Up" becomes "Logout (name)" once a token is stored.
  - Each "Book Now" button now calls `POST /api/bookings` with the matching
    program's real database `_id` (fetched from `GET /api/programs` on page
    load). If you're not logged in, it redirects to `login.html` first.
  - "My Bookings" calls `GET /api/bookings/mine` and lists your bookings.
  - A small toast in the bottom-right shows success/error feedback.

## Setup

```bash
npm install
cp .env.example .env        # then edit MONGODB_URI / JWT_SECRET if needed
npm run seed                 # creates the 4 programs + 4 trainers shown on the homepage
npm start                    # http://localhost:3000
```

Requires a running MongoDB (local `mongod` or a connection string from
MongoDB Atlas) at the `MONGODB_URI` in `.env`.

Then open **http://localhost:3000/home.html** — the server serves the
frontend itself, so there's no separate frontend process or CORS to worry
about.

## API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account, returns a JWT |
| POST | `/api/auth/login` | — | Log in, returns a JWT |
| GET | `/api/programs` | — | List active workout plans / wellness programs |
| POST | `/api/bookings` | Bearer token | Book a program — auto-assigns a trainer by category, creates a Booking + a mocked "paid" Payment |
| GET | `/api/bookings/mine` | Bearer token | List the logged-in member's bookings |

## Notes

- Payment is **mocked** — booking a plan immediately creates a `Payment`
  record with `status: 'paid'`. Swap in a real gateway (Stripe/Razorpay) in
  `routes/bookings.js` when you're ready; the `Payment` model already has the
  fields for it (`method`, `providerTransactionId`, etc.).
- Trainer assignment is automatic: the first trainer whose `specialties`
  matches the program's `category`. Seed data has one trainer per category.
- All request bodies are validated server-side (email format, password
  length, required fields) — errors come back as `{ error: "message" }` with
  a 400/401/404 status, which the frontend now reads and displays.
