# ThreadPoint Frontend (React 19, Vite, TailwindCSS v4)

ThreadPoint Contributor UI and Web Client built with modern developer aesthetics, responsive layouts, and dual-provider authentication.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Vite dev server with proxy to backend
npm run dev

# Production build
npm run build
```

---

## Environment Configuration (`.env`)

Create `.env` based on `.env.example`:

```ini
# Google OAuth 2.0 Client ID for Google Identity Services (GIS)
# Where to obtain: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
```

> **Developer Fallback**: If `VITE_GOOGLE_CLIENT_ID` is left empty, the application provides a "Dev: Simulate Google 1-Click Login" button on sign-in and registration pages for instant local testing without cloud setup.

---

## Key Features & Components

- **Google OAuth 2.0 (`@react-oauth/google`)**: Official Google Identity Services button with one-click token exchange.
- **6-Digit OTP Verification Modal (`OtpModal.jsx`)**: Auto-advancing inputs, clipboard paste support, 60-second cooldown timer, and terminal developer code auto-fill chip.
- **Hybrid Password Management (`ProfilePage.jsx`)**: Account security card allowing Google users to configure a password for direct credentials login.
- **Header Verification Pill (`Header.jsx`)**: Notification badge for unverified users.
- **Interactive Markdown Question Composer (`AskPage.jsx`)**: Live duplicate question matcher with full-text search.
- **Keyboard Navigation (`CommandPalette.jsx`)**: Global Command/Ctrl + K overlay for instant search across questions and tags.
