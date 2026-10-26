# ThreadPoint

Technical Question-and-Answer and Knowledge Exchange Platform

---

## Overview

ThreadPoint is an engineering-focused technical question-and-answer platform built for developer communities and software engineering teams. It combines the accepted-solution and reputation dynamics of Stack Overflow, the topical breadth of Quora, and the voting velocity of Reddit into a performant, unified PERN (PostgreSQL, Express, React, Node.js) architecture.

A core engineering design decision in ThreadPoint is delegating business invariants directly to the relational database layer. Rather than depending exclusively on application-level controllers that can be susceptible to race conditions under concurrent workloads, PostgreSQL stored procedures, triggers, and partial unique indexes authoritatively enforce single accepted solutions, polymorphic target integrity, and real-time reputation scoring.

ThreadPoint features a dual-provider authentication architecture supporting Google OAuth 2.0 (Google Identity Services), local email and password authentication, 6-digit one-time password (OTP) email verification, and authenticated account linking.

---

## Architectural Principles and Data Invariants

### 1. Database-Enforced Business Logic
Core domain invariants are managed and enforced directly within PostgreSQL:
- **Single Accepted Solution**: A PostgreSQL partial unique index (`one_accepted_per_question`) combined with a `BEFORE INSERT OR UPDATE` trigger (`trg_check_single_accepted_answer`) guarantees that a question can never possess more than one accepted answer.
- **Authoritative Reputation Ledger**: Stored procedure `recalculate_user_reputation` recalculates an author's reputation score on every vote insertion, modification, deletion, or answer acceptance event. User reputation can never drop below the baseline score of 1.
  - Question upvote received: +10 reputation
  - Question downvote received: -2 reputation
  - Answer upvote received: +10 reputation
  - Answer downvote received: -2 reputation
  - Answer accepted: +15 reputation to answer author
  - Accepting an answer: +2 reputation to question author
- **Polymorphic Target Validation**: Triggers on `Vote` and `Comment` tables validate that polymorphic targets (`target_type` of `'question'` or `'answer'`) reference existing, valid rows prior to persisting.
- **Full-Text Search with Generated tsvector**: The `Question` table utilizes a generated `tsvector` column (`search_vector`) with weighted fields (Weight A for title, Weight B for body), indexed via a Generalized Inverted Index (GIN) for sub-5 millisecond ranked queries with `ts_rank` and `ts_headline`.
- **Time-Decayed Hot Ranking View**: The `hot_questions` view computes an algorithmic hot score using an exponential time-decay formula balancing votes, answers, views, and question age.

### 2. Dual-Provider Authentication and Account Linking
- **Google OAuth 2.0 (GIS)**: Frontends exchange Google ID tokens with the backend via cryptographic validation using `google-auth-library`. Pure Google users start with `password_hash = NULL` and `auth_provider = 'google'`. Google accounts are marked with `is_email_verified = TRUE` automatically.
- **Local Credentials and OTP Verification**: Users registering with email and password trigger a 6-digit OTP dispatch. OTPs are hashed using `bcrypt` and stored in the `EmailOtp` table with a 10-minute expiry, 60-second cooldown rate limit, and a maximum threshold of 5 failed verification attempts.
- **Account Linking and Dual-Mode Login**: Authenticated Google users can set a local password via `POST /api/auth/set-password`. Setting a password upgrades the account's `auth_provider` to `'both'`, permitting sign-in through either Google OAuth or standard password credentials.

### 3. Dual-Mode Persistence Architecture
ThreadPoint supports both production PostgreSQL databases and an integrated in-memory persistence store. If the PostgreSQL instance is unreachable during initial startup, the backend automatically transitions to the in-memory fallback store seeded with identical demo data, ensuring complete system availability for evaluation, development, and offline testing.

---

## System Architecture

```
                          ThreadPoint Client
                  (React 19, Vite, TailwindCSS v4)
                   |                             |
      Google OAuth |                             | Email / Password
     (Google GIS)  |                             | & 6-Digit OTP
                   v                             v
       +-----------------------+     +-----------------------+
       | Google One-Tap/Popup  |     | Sign-Up / Login Forms |
       | ID Token Issuance     |     | Auto-Advancing OTP    |
       +-----------+-----------+     +-----------+-----------+
                   |                             |
                   +--------------+--------------+
                                  |
                                  v
                      Express Backend API (Node.js)
                      |
                      +-- Authentication (/api/auth)
                      |   |-- Google Token Exchange & Account Linking
                      |   |-- Bcrypt Registration & Login
                      |   |-- OTP Generation, Verification & Cooldown
                      |   +-- Password Configuration for Google Accounts
                      |
                      +-- Core Resources
                      |   |-- Questions Feed & Filtering (/api/questions)
                      |   |-- Answers & Solution Acceptance (/api/answers)
                      |   |-- Upvoting & Downvoting (/api/votes)
                      |   |-- Bookmarks Management (/api/bookmarks)
                      |   |-- Nested Comment Threads (/api/comments)
                      |   |-- Topic Tags Directory (/api/tags)
                      |   |-- Full-Text Ranked Search (/api/search)
                      |   +-- Leaderboards & Profiles (/api/users)
                      |
                      v
             PostgreSQL Relational Engine (3NF Normalized)
             |
             +-- Tables: User, EmailOtp, Question, Answer, Tag, QuestionTag, Vote, Comment, Bookmark, UserFollow
             +-- Partial Unique Index: Exactly one accepted answer per question
             +-- Stored Procedures: Automatic recalculate_user_reputation()
             +-- Triggers: trg_vote_reputation_sync, trg_answer_accepted_reputation_sync
             +-- Full-Text Search: Weighted tsvector + GIN indexing
             +-- Views: hot_questions (time-decayed ranking), user_leaderboard
```

---

## Technology Stack

### Frontend
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8
- **Styling**: TailwindCSS v4 with `@tailwindcss/vite`
- **Routing**: React Router 7 (`react-router-dom`)
- **Animation & Transitions**: Motion (`motion/react`)
- **Authentication Client**: Google Identity Services via `@react-oauth/google`
- **Icons**: Lucide React (`lucide-react`)
- **Linter**: Oxlint (`oxlint`)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js 4
- **Database Client**: `pg` (Node-Postgres Connection Pool) and Prisma ORM 5
- **OAuth Verification**: Google Auth Library (`google-auth-library`)
- **Email Delivery**: Nodemailer (`nodemailer`)
- **Security & Tokens**: JSON Web Token (`jsonwebtoken`), Bcrypt (`bcryptjs`)
- **Logging & Utilities**: Morgan (`morgan`), Dotenv (`dotenv`)

### Database
- **Engine**: PostgreSQL 14+ (tested on PostgreSQL 16)
- **Normalization**: Third Normal Form (3NF)
- **Procedural Language**: PL/pgSQL for stored procedures and triggers
- **Indexing**: B-Tree indexes on foreign keys, GIN index on `search_vector`, partial unique indexes

---

## Repository Structure

```
ThreadPoint/
|-- .gitignore                            # Git exclusion rules
|-- package.json                          # Workspace root runner (concurrently backend + frontend)
|-- package-lock.json
|-- README.md                             # Technical platform documentation
|
|-- backend/
|   |-- .env.example                      # Backend environment template with setup guide
|   |-- .env                              # Local backend environment configuration
|   |-- package.json                      # Backend dependencies and scripts
|   |-- package-lock.json
|   |-- README.md                         # Backend-specific documentation
|   |-- prisma/
|   |   `-- schema.prisma                 # Prisma schema definition (User, EmailOtp)
|   |-- sql/
|   |   |-- 01_schema.sql                 # 3NF relational schema, EmailOtp, tsvector, indexes
|   |   |-- 02_triggers.sql               # Stored procedures and reputation/integrity triggers
|   |   |-- 03_views.sql                  # hot_questions and user_leaderboard views
|   |   `-- 04_seed.sql                   # Initial technical seed personas, questions, and tags
|   |-- scripts/
|   |   `-- init-db.js                    # Automated SQL migrations and Prisma client runner
|   `-- src/
|       |-- server.js                     # Express application entrypoint
|       |-- lib/
|       |   |-- db.js                     # PostgreSQL connection pool, Prisma, and memory fallback
|       |   `-- mailer.js                 # Nodemailer email dispatcher with dev fallback
|       |-- middleware/
|       |   |-- auth.js                   # JWT extraction and validation middleware
|       |   `-- validate.js               # Request payload schema validation
|       `-- routes/
|           |-- auth.js                   # Google OAuth, registration, login, OTP, and password routes
|           |-- questions.js              # Question retrieval, creation, and filtering routes
|           |-- answers.js                # Answer creation and solution acceptance routes
|           |-- votes.js                  # Upvoting and downvoting with database trigger sync
|           |-- bookmarks.js              # User question bookmarking and collection retrieval
|           |-- comments.js               # Polymorphic threaded discussion comments
|           |-- tags.js                   # Tag discovery, usage metrics, and detail lookup
|           |-- search.js                 # Full-text search with ts_rank and ts_headline
|           |-- users.js                  # User profile, contribution statistics, and leaderboard
|           `-- health.js                 # System health check, database ping, and table metrics
|
`-- frontend/
    |-- .env.example                      # Frontend environment template with Google Client ID guide
    |-- .env                              # Local frontend environment configuration
    |-- index.html                        # Application HTML shell
    |-- vite.config.js                    # Vite configuration with TailwindCSS v4 and proxy
    |-- package.json                      # Frontend dependencies and scripts
    |-- package-lock.json
    |-- README.md                         # Frontend-specific documentation
    `-- src/
        |-- main.jsx                      # React 19 entrypoint wrapped in GoogleOAuthProvider
        |-- App.jsx                       # Top-level shell, routing table, and overlay management
        |-- index.css                     # Tailwind v4 theme variables and typography
        |-- api/
        |   `-- client.js                 # API client wrapper with authentication interceptor
        |-- context/
        |   `-- AuthContext.jsx           # Global authentication state and OTP modal coordinator
        |-- components/
        |   |-- layout/
        |   |   |-- Header.jsx            # Top navigation bar, unverified email badge, persona switcher
        |   |   `-- Sidebar.jsx           # Desktop navigation rail and mobile navigation drawer
        |   |-- common/
        |   |   |-- CommandPalette.jsx    # Keyboard-driven search modal (Command/Ctrl + K) with local storage history
        |   |   |-- AuthModal.jsx         # Modal dialog for credentials and Google sign-in
        |   |   `-- OtpModal.jsx          # 6-digit auto-advancing OTP verification dialog
        |   `-- feed/
        |       `-- QuestionCard.jsx      # Feed card component with optimistic vote updating
        `-- pages/
            |-- FeedPage.jsx              # Main feed with sorting (Interesting, Hot, Unanswered, Votes)
            |-- QuestionDetailPage.jsx    # Question thread, answer list, comments, and accept action
            |-- AskPage.jsx               # Markdown question composer with live duplicate detection
            |-- TagsPage.jsx              # Topic tags catalog with question volume metrics
            |-- LeaderboardPage.jsx       # Ranked contributor leaderboard by live reputation
            |-- BookmarksPage.jsx         # User saved questions repository
            |-- ProfilePage.jsx           # Account security, reputation breakdown, and dual-auth settings
            |-- LoginPage.jsx             # Dedicated sign-in page with Google OAuth button
            `-- SignUpPage.jsx            # Dedicated registration page with OTP initiation
```

---

## Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```ini
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/threadpoint?schema=public"

# Application Settings
PORT=5000
JWT_SECRET="threadpoint_super_secret_jwt_key_2026_dev"
NODE_ENV="development"

# Google OAuth 2.0 Credentials
# Obtain from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# SMTP Email Dispatch (for 6-digit OTP verification)
# Obtain from: https://myaccount.google.com/apppasswords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="ThreadPoint Security <noreply@threadpoint.dev>"
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```ini
# Google OAuth 2.0 Client ID for Google Identity Services (GIS)
# Obtain from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
```

### Credentials Reference

| Variable | Description | Source / Configuration Procedure |
|---|---|---|
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID | [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)<br>1. Create Credentials &rarr; OAuth Client ID.<br>2. Application type: Web application.<br>3. Under Authorized JavaScript origins, add `http://localhost:5173` and `http://127.0.0.1:5173`.<br>4. Copy the generated Client ID to both backend and frontend `.env` files. |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)<br>Generated alongside the Web Client ID for backend token validation. |
| `SMTP_USER` / `SMTP_PASS` | Outgoing SMTP Credentials | [Google Account App Passwords](https://myaccount.google.com/apppasswords)<br>1. Ensure 2-Step Verification is active on the Google account.<br>2. Generate an App Password with the label `ThreadPoint`.<br>3. Paste the 16-character password into `SMTP_PASS`. |

### Zero-Configuration Local Development Fallbacks

ThreadPoint includes zero-configuration developer fallbacks so the application can be fully tested without external cloud credentials:
- **Google OAuth Simulation**: If `GOOGLE_CLIENT_ID` is empty or pending, sign-in and registration pages display a "Dev: Simulate Google 1-Click Login" option that exercises the full account creation, verification, and session token pipeline.
- **Terminal OTP Logging**: If SMTP credentials are not configured, OTP verification codes are printed directly to the backend terminal (`[DEV OTP] Code: >>> 123456 <<<`) and display an instant one-click auto-fill chip in the frontend `OtpModal` component.
- **Database Fallback**: If PostgreSQL is temporarily inactive, the backend operates transparently using the internal memory store.

---

## Installation and Quick Start

### 1. Prerequisites
- Node.js 18.x or higher (Node.js 20+ recommended)
- PostgreSQL 14+ (optional for initial evaluation due to built-in memory fallback)
- npm 9+

### 2. Dependency Installation

From the root project directory:

```bash
# Install root orchestration dependency (concurrently)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Database Initialization

Ensure PostgreSQL is running and update `DATABASE_URL` in `backend/.env`. Then run:

```bash
npm run db:init
```

The initialization runner executes sequentially:
1. `backend/sql/01_schema.sql`: Creates 3NF tables, `EmailOtp` table, full-text search `tsvector` generated column, indexes, and constraints.
2. `backend/sql/02_triggers.sql`: Defines stored procedures and registers triggers for single accepted answers, polymorphic vote validation, and reputation synchronization.
3. `backend/sql/03_views.sql`: Compiles the `hot_questions` time-decay view and `user_leaderboard` view.
4. `backend/sql/04_seed.sql`: Seeds developer personas, baseline questions, tagged topics, accepted solutions, and initial votes.
5. Generates the updated Prisma Client.

### 4. Running the Application

From the root project directory, execute:

```bash
npm run dev
```

This starts both services concurrently using colored terminal streams:
- **Backend API**: `http://localhost:5000`
- **Frontend Application**: `http://localhost:5173`
- **API Health Check**: `http://localhost:5000/api/health`

### 5. Production Build

To compile the production frontend asset bundle:

```bash
npm run build
```

The optimized bundle is written to `frontend/dist`.

---

## Demo Personas

The initial seed migration provides pre-configured developer personas for immediate evaluation of permissions, triggers, and reputation rules:

| Username | Role and Technical Focus | Reputation | State and Test Capabilities |
|---|---|---|---|
| `carol_dba` | Senior Backend Architect | 61 | Author of verified accepted solution on Question 1; high-reputation privileges. |
| `alice_dev` | Distributed Systems Specialist | 43 | Active contributor with verified email status. |
| `david_fullstack` | Performance & Full-Stack Developer | 33 | Author of Question 2 (demonstrating weighted FTS queries). |
| `bob_sql` | Full-Stack PERN Engineer | 28 | Author of Question 1; possesses authorization to accept or unaccept answers on Question 1. |

*Default password for all seeded accounts:* `password123`

The application includes an active persona dropdown in the top header and a one-click switcher on the authentication modal for rapid persona switching during testing.

---

## Complete REST API Specification

### Authentication & Account Security (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/google` | Public | Exchanges Google Identity Services ID token, links or creates account, sets verified email status. |
| `POST` | `/api/auth/register` | Public | Registers user with email and password, creates unverified user, and dispatches 6-digit OTP email. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns actionable guidance if the account was registered via Google only. |
| `POST` | `/api/auth/send-otp` | Public | Generates and sends a 6-digit verification code with 60s cooldown and 10m expiry. |
| `POST` | `/api/auth/resend-otp` | Public | Resends OTP code adhering to active cooldown timers. |
| `POST` | `/api/auth/verify-otp` | Public | Compares submitted code against bcrypt hash; marks `is_email_verified = TRUE` on success. |
| `POST` | `/api/auth/set-password` | Authenticated | Allows Google OAuth users to configure a password, upgrading `auth_provider` to `'both'`. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user record with verification and provider status. |
| `POST` | `/api/auth/demo-switch` | Public | Instantly switches active JWT session between pre-seeded demo accounts. |

### Questions (`/api/questions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/questions` | Public | Retrieves questions feed with pagination (`page`, `limit`), tag filter (`tag`), and sorting (`interesting`, `hot`, `unanswered`, `votes`). |
| `GET` | `/api/questions/:id` | Public | Retrieves full question details with author metadata, tags, answer list, and increments view count. |
| `POST` | `/api/questions` | Authenticated | Submits new question with markdown body and array of tag strings. Associates tags in `QuestionTag`. |

### Answers & Solution Acceptance (`/api/answers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/questions/:id/answers` | Authenticated | Submits an answer to the specified question. |
| `PATCH`| `/api/answers/:id/accept` | Authenticated | Toggles accepted answer status. Enforces that only the question author can accept, and triggers reputation updates (+15 to answerer, +2 to asker). |

### Voting (`/api/votes`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/votes` | Authenticated | Casts or modifies a vote (`value`: `1`, `-1`, or `0` to cancel). Enforces one vote per user per target; fires database reputation triggers. |
| `GET` | `/api/votes/my-votes` | Authenticated | Returns dictionary of active user votes mapped by polymorphic target key. |

### Bookmarks (`/api/bookmarks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookmarks` | Authenticated | Retrieves all questions bookmarked by the authenticated user with author stats and answer counts. |
| `POST` | `/api/bookmarks/:questionId` | Authenticated | Toggles bookmark status for a question. |

### Comments (`/api/comments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/comments` | Public | Retrieves threaded comments filtered by `target_type` (`question` or `answer`) and `target_id`. |
| `POST` | `/api/comments` | Authenticated | Submits comment on a question or answer. Validated by polymorphic target trigger. |

### Topic Tags (`/api/tags`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tags` | Public | Lists all tags ordered by total question usage count. |
| `GET` | `/api/tags/:name` | Public | Returns detailed tag information, description, and related question volume. |

### Full-Text Search (`/api/search`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/search?q=:query&type=:type` | Public | Executes unified search across questions (via `ts_rank` weighted GIN index) and contributors (`User` table by username and bio). Supports `type=all`, `type=questions`, or `type=users`. |

### Users & Social Graph (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/leaderboard` | Public | Retrieves contributor rankings from the `user_leaderboard` view ordered by reputation. |
| `GET` | `/api/users/:identifier` | Public (Optional JWT) | Retrieves user profile by username or numeric ID, follower/following counts, verification status, and questions/answers history. |
| `POST` | `/api/users/:identifier/follow` | Authenticated (JWT) | Toggles follow / unfollow status for the target user. Prevents self-following. |
| `GET` | `/api/users/:identifier/followers` | Public | Retrieves list of contributors following the specified user, including reputation and avatars. |
| `GET` | `/api/users/:identifier/following` | Public | Retrieves list of contributors followed by the specified user, including reputation and avatars. |

### System Health & Monitoring (`/api/health`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns system uptime, active database mode (PostgreSQL vs. Memory Store), connection latency, and table volume metrics. |

---

## Database Schema & Trigger Reference

### Database Schema Definition

```sql
-- Core User Account Ledger
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    reputation_score INT DEFAULT 1 NOT NULL,
    is_google_auth BOOLEAN DEFAULT FALSE NOT NULL,
    auth_provider VARCHAR(20) DEFAULT 'local' NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- One-Time Password Verification Records
CREATE TABLE "EmailOtp" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'email_verification' NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Questions with Weighted Search Vector
CREATE TABLE "Question" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    views INT DEFAULT 0 NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(body, '')), 'B')
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Answers with Single Accepted Invariant
CREATE TABLE "Answer" (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Partial Unique Index guaranteeing at most one accepted answer per question
CREATE UNIQUE INDEX one_accepted_per_question 
ON "Answer" (question_id) WHERE is_accepted = TRUE;

-- Polymorphic Voting Ledger
CREATE TABLE "Vote" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INT NOT NULL,
    value SMALLINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_target_vote UNIQUE (user_id, target_type, target_id),
    CONSTRAINT check_vote_value CHECK (value IN (-1, 1))
);
```

### Hot Ranking Score Formula

Trending questions are ranked in real time using the `hot_questions` view with a time-decay logarithmic curve:

```sql
ROUND(
    ( (COALESCE(net_votes, 0) * 10.0 + COALESCE(answer_count, 0) * 5.0 + views * 0.1 + 10.0) /
      POWER((EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 + 2.0), 1.5)
    )::numeric, 4
) AS hot_score
```

This balances voting velocity, answer participation, and view traffic against an exponential time decay.

---

## Verification and Testing

### Build Verification
To ensure all frontend assets and JSX syntax compile cleanly:

```bash
npm run build:frontend
```

### Backend Syntax Validation
To verify the Node.js backend modules and dependencies without launching the server:

```bash
node --check backend/src/server.js
```

### Health Check Verification
With the server running, query the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected output confirms database connectivity mode, connection latency, and table volumes:

```json
{
  "status": "ok",
  "service": "ThreadPoint PERN Backend",
  "version": "1.0.0",
  "database": {
    "provider": "PostgreSQL",
    "status": "connected",
    "mode": "PostgreSQL Active (Prisma + Raw SQL Triggers)"
  }
}
```

---

## License

This project is licensed under the MIT License.
