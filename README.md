# MyCalibreServer
my own calibre server

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- A Calibre library

### Installation

1. Clone the repository
```bash
git clone https://github.com/bibulle/myCalibreServer.git
cd myCalibreServer
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
- **SESSION_SECRET** (REQUIRED): Strong random string for session encryption
- **AUTHENT_JWT_SECRET** (REQUIRED): Strong random string for JWT tokens
- **PATH_BOOKS**: Path to your Calibre library
- **PATH_MY_CALIBRE**: Path for cache storage
- Google/Facebook OAuth credentials (optional)

You can generate secure secrets with:
```bash
openssl rand -base64 32
```

4. Start the application
```bash
npm start
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Secret for session encryption (REQUIRED) | `your-random-secret-32-chars` |
| `AUTHENT_JWT_SECRET` | Secret for JWT token signing (REQUIRED) | `your-jwt-secret-32-chars` |
| `PORT` | Server port | `3333` |
| `PATH_BOOKS` | Path to Calibre library | `/path/to/calibre/library` |
| `PATH_MY_CALIBRE` | Cache directory | `/path/to/cache` |
| `LOG_LEVEL` | Logging level | `LOG`, `DEBUG`, `VERBOSE` |

### Optional Environment Variables (OAuth)

| Variable | Description |
|----------|-------------|
| `AUTHENT_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `AUTHENT_GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `AUTHENT_FACEBOOK_APP_ID` | Facebook App ID |
| `AUTHENT_FACEBOOK_APP_SECRET` | Facebook App Secret |

### Security Best Practices

⚠️ **Never commit your `.env` file to version control!**

- Use strong, randomly generated secrets for `SESSION_SECRET` and `AUTHENT_JWT_SECRET`
- Rotate secrets regularly in production
- Use different secrets for development and production environments
- Store production secrets securely (e.g., using secret management tools)

