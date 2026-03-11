# Hospital Jobs Server

Backend API server for [ihospitaljobs.com](https://ihospitaljobs.com). Provides authentication, user management, and job CRUD endpoints.

## Tech Stack

- **Runtime**: Node.js, Express 4
- **Database**: Supabase (primary, `server_v2.js`) / MySQL on AWS RDS (legacy, `server.js`)
- **Auth**: bcrypt password hashing
- **Config**: dotenv for environment variables

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
| `npm start` | Start server (`node server`) |
| `npm run dev` | Start with auto-reload (`nodemon server`) |

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
