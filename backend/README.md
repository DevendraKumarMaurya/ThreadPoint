# ThreadPoint Backend API & Database Engine

Express.js backend and 3NF normalized PostgreSQL engine powering ThreadPoint. Enforces core business invariants, single accepted solution rules, and reputation reconciliation directly at the database layer with triggers, while providing a dual-provider authentication architecture (Google OAuth 2.0, Password Authentication, and 6-Digit OTP Email Verification).

---

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Configure environment
cp .env.example .env

# 3. Bootstrap PostgreSQL database & triggers (optional if running in dev mock mode)
npm run db:init

# 4. Start backend server (port 5000)
npm run dev
```

---

## Environment Variables (`backend/.env`)

| Variable | Description | Where to Obtain / Direct Link |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://USER:PASSWORD@HOST:5432/threadpoint?schema=public` |
| `PORT` | API Server listening port | Default: `5000` |
| `JWT_SECRET` | Secret key for signing session tokens | Any strong random string |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for token validation | [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)<br>- Application type: Web application<br>- Authorized origins: `http://localhost:5173` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) |
| `SMTP_HOST` | Outgoing email host (e.g. `smtp.gmail.com`) | [Google Account App Passwords](https://myaccount.google.com/apppasswords)<br>- Requires 2-Step Verification |
| `SMTP_PORT` | Outgoing SMTP port (default `587` or `465`) | `587` |
| `SMTP_USER` | SMTP email address | Your email address |
| `SMTP_PASS` | 16-character Google App Password | [Google Account App Passwords](https://myaccount.google.com/apppasswords) |
| `SMTP_FROM` | Sender display name & email | e.g. `"ThreadPoint Security <noreply@threadpoint.dev>"` |

> **Local Developer Experience**:
> - If `GOOGLE_CLIENT_ID` is empty, developer test tokens (`dev-mock-google-token:...`) are supported for instant local testing.
> - If SMTP credentials are empty, OTP verification codes are printed directly to the server terminal:
>   ```
>   ======================================================
>   [DEV OTP] Target: developer@example.com
>   [DEV OTP] Purpose: email_verification
>   [DEV OTP] Code: >>> 849201 <<< (Expires in 10 mins)
>   ======================================================
>   ```

---

## Authentication & Security Architecture

### 1. Dual-Provider & Hybrid Authentication
- **Google OAuth 2.0 (GIS)**: Validates cryptographically signed Google ID tokens (`POST /api/auth/google`) using `google-auth-library`. Extracts verified identity (`sub`, `email`, `email_verified`). Automatically sets `is_email_verified = true`.
- **Hybrid Account Linking**:
  - Pure Google accounts start with `password_hash: null` and `auth_provider: 'google'`.
  - Google users can set a password at any time via `POST /api/auth/set-password` (authenticated with JWT).
  - Once configured, `auth_provider` upgrades to `'both'`, allowing sign-in via either Google or email/password.
  - Password login on Google-only accounts returns a helpful guide: `"This account was created with Google. Please click 'Continue with Google' or set a password in your account settings."`

### 2. 6-Digit Email OTP Verification
- **Storage**: The 6-digit random code is hashed with `bcryptjs` before persisting to the `EmailOtp` table, ensuring active codes are never exposed in plaintext database snapshots.
- **Expiry & Rate Limiting**:
  - Codes expire after **10 minutes**.
  - Resend requests (`POST /api/auth/resend-otp`) are throttled with a strict **60-second cooldown**.
  - Maximum **5 failed verification attempts** per OTP before the code is permanently invalidated.

---

## Database Architecture & Invariants

### 1. Database Schema (`backend/sql/01_schema.sql` & `prisma/schema.prisma`)
- **`User`**: Contributor profiles with `is_google_auth`, `auth_provider`, `google_id`, and `is_email_verified`.
- **`EmailOtp`**: OTP dispatch records with bcrypt hash, purpose (`email_verification` | `password_reset`), and attempt counters.
- **`Question`**: Discussion threads with generated stored `tsvector` weighted column (`search_vector`).
- **`Answer`**: Community solutions with `is_accepted` flag.
- **`Tag` & `QuestionTag`**: 3NF normalized many-to-many topic relationships.
- **`Comment`**: Hierarchical threaded discussions with self-referencing recursive tree.
- **`UserFollow`**: Social graph ledger with composite unique index on `(follower_id, following_id)`, self-follow check constraint, and foreign key cascades.


### 2. Database Triggers (`backend/sql/02_triggers.sql`)
- **Single-Accepted-Answer Invariant**:
  - Enforced by partial unique index: `CREATE UNIQUE INDEX one_accepted_per_question ON "Answer"(question_id) WHERE is_accepted = true;`
  - Guarded by `BEFORE INSERT OR UPDATE` trigger `check_single_accepted_answer`.
- **Authoritative Reputation Reconciliation**:
  - `recalculate_user_reputation(user_id)` dynamically aggregates:
    - **+10** for each upvote on questions and answers.
    - **-2** for each downvote on questions and answers.
    - **+15** for verified accepted solutions.
    - **+2** for the question author marking an accepted answer.
  - Triggers `trg_vote_reputation_sync` and `trg_answer_accepted_reputation_sync` keep reputations consistent on every database modification.

---

## REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/google` | Google ID Token exchange & user provisioning | No |
| `POST` | `/api/auth/register` | Register new account & dispatch verification OTP | No |
| `POST` | `/api/auth/login` | Authenticate with email/username and password | No |
| `POST` | `/api/auth/send-otp` | Generate and dispatch 6-digit verification code | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP & mark email verified | No |
| `POST` | `/api/auth/resend-otp` | Throttled OTP resend (60s cooldown) | No |
| `POST` | `/api/auth/set-password`| Set/update password for Google or local account | Yes (JWT) |
| `GET` | `/api/auth/me` | Fetch active user session & profile | Yes (JWT) |
| `POST` | `/api/auth/demo-switch`| Switch active demo persona | No |

### Questions & Answers (`/api/questions`, `/api/answers`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions` | Feed with sorting (`interesting`, `hot`, `newest`, `unanswered`, `votes`) and tag filtering |
| `GET` | `/api/questions/:id` | Full question details, view counter increment, accepted answers |
| `POST` | `/api/questions` | Create question with markdown body and tags |
| `POST` | `/api/questions/:id/answers` | Submit an answer to a question |
| `PATCH`| `/api/answers/:id/accept` | Toggle accepted solution status (question author only) |

### Votes, Comments, Tags & Search
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/votes` | Cast or change vote (`+1`, `-1`, `0` to cancel) |
| `GET` | `/api/votes/my-votes` | Fetch active user's vote history |
| `GET` | `/api/comments` | Fetch hierarchical comment tree |
| `POST` | `/api/comments` | Post threaded comment reply |
| `GET` | `/api/tags` | List all tags with usage counts |
| `GET` | `/api/tags/:name` | Tag detail & question count |
| `GET` | `/api/search?q=&type=` | Unified search across questions (`ts_rank`) and contributors |
| `GET` | `/api/users/leaderboard` | Top contributors ranked by live reputation score |
| `GET` | `/api/users/:identifier` | User profile by username or ID, follower counts, and history |
| `POST`| `/api/users/:identifier/follow` | Toggle follow / unfollow for target user (JWT required) |
| `GET` | `/api/users/:identifier/followers` | List followers of target user |
| `GET` | `/api/users/:identifier/following` | List users followed by target user |
| `GET` | `/api/health` | System status, PostgreSQL connection, uptime |

---

## Database Scripts

```bash
# Apply SQL migrations, triggers, views, and seed data:
npm run db:init

# Push Prisma schema to PostgreSQL:
npm run db:push

# Regenerate Prisma Client:
npm run db:generate
```
