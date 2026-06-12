# DecodeLabs Internship Project 2 - REST API

A production-ready REST API built with Node.js, Express, and MongoDB Atlas with **in-memory fallback** for demo/portfolio purposes.

## Features

- **User Authentication** — JWT-based auth with register/login/me endpoints
- **CRUD Operations** — Users, Posts, Contacts
- **Security** — Helmet, CORS, Rate Limiting
- **In-Memory Fallback** — Works without MongoDB for demos
- **Health Check** — `/api/health` endpoint for monitoring
- **Dashboard Stats** — `/api/stats` for frontend integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (with in-memory fallback) |
| Auth | JWT + bcryptjs |
| Security | Helmet, CORS, express-rate-limit |

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Run Development Server
```bash
npm run dev
```

Server starts at `http://localhost:3000`

## API Endpoints

### Health & Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/stats` | Dashboard statistics |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (requires Bearer token) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create new user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all posts |
| POST | `/api/posts` | Create new post |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contact` | Get all messages |
| POST | `/api/contact` | Submit contact message |

## In-Memory Mode

If MongoDB Atlas is unavailable, the server automatically switches to **in-memory storage** with pre-seeded demo data:

- 2 sample users (including admin)
- 2 sample posts
- Empty contacts (fills as you submit)

Health endpoint shows which mode is active:
```json
{
  "success": true,
  "status": "UP",
  "database": "in-memory"
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `MONGO_URI` | No | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `NODE_ENV` | No | Environment mode (development/production/test) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run Jest tests with coverage |

## Frontend Integration

Update your frontend `js/main.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api', // Local
    // API_BASE_URL: 'https://your-ngrok-url.ngrok-free.app/api', // ngrok
};
```

## License

MIT
