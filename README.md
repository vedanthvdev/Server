# Hospital Jobs Server

Backend API server for [ihospitaljobs.com](https://ihospitaljobs.com). Provides authentication, user management, and job CRUD endpoints.

## Tech Stack

- **Runtime**: Node.js, Express 4
- **Database**: Supabase / MySQL on AWS RDS (legacy, `server.js`)
- **Auth**: bcrypt password hashing
- **Testing**: Jest, Supertest
- **Config**: dotenv for environment variables

## Project Structure

```
src/
  app.js              # Express app: mounts middleware + routes
  server.js           # Entry point: imports app, calls listen()
  config/index.js     # PORT, SUPABASE_URL, SUPABASE_KEY from env
  db/supabase.js      # Supabase client singleton
  routes/auth.js      # Auth endpoints (signup, login, password, profile)
  routes/jobs.js      # Job endpoints (CRUD, click tracking)
  middleware/cors.js   # Custom CORS origin allowlist
  utils/password.js    # bcrypt password hashing helper
tests/
  helpers/mockSupabase.js   # Reusable Supabase mock chain factory
  unit/                     # Isolated handler logic tests (mocked DB)
  integration/              # Full Express HTTP cycle tests
  e2e/                      # Multi-step user journey tests
```

## Setup

```bash
npm install
cp .env.example .env  # then fill in your credentials
```

### Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `DB_USERNAME` | MySQL username (legacy) |
| `DB_PASSWORD` | MySQL password (legacy) |

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start server |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm test` | Run all tests (unit + integration + e2e) |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:e2e` | Run e2e tests only |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/signup` | Register a new user |
| POST | `/api/authenticate` | Login |
| POST | `/api/emailalreadyregistered` | Check if email exists |
| POST | `/api/getuser` | Get user details |
| POST | `/api/forgotpassword` | Check email for password reset |
| POST | `/api/updatepassword` | Update user password |
| POST | `/api/updateprofile` | Update user profile |
| POST | `/api/registerjob` | Post a new job |
| GET | `/api/getjobs` | Get all jobs |
| GET | `/api/getrecentjobs` | Get 10 most recent jobs |
| POST | `/api/getuseruploadedjobs` | Get jobs posted by a user |
| POST | `/api/deletejob` | Delete a job |
| POST | `/api/updateclick` | Increment job click count |
