# DecodeLabs Internship 2026 — Project 2: Backend API Development

> **Batch 2026 | Powered by DecodeLabs**
>
> *"Project 1 was the skin. Project 2 is the life."* — Martina Plantijn

---

## 🧠 The Nervous System

Project 2 is your **integration phase**: Backend API Development. This isn't about visual flair — it's about the application's brain. Before you scale into complex databases, you must master building robust endpoints and managing the flow of data between your frontend and the server.

**Goal:** Develop a simple backend API to handle application logic.

---

## 🎯 Key Requirements

---

## 🏗️ Architecture: The Nervous System

```
┌─────────────────────────────────────────────────────┐
│  CLIENT (Browser)  →  Project 1 Frontend            │
│  • Touchpoint Activation                            │
│  • User Interface Layer                             │
├─────────────────────────────────────────────────────┤
│  THE NETWORK VOID                                   │
│  • Latency Critical Path                            │
│  • Bandwidth Flow                                   │
├─────────────────────────────────────────────────────┤
│  API GATEWAY / Brain Stem                           │
│  • Authentication Gate                              │
│  • Rate Limiting (Circuit Breakers)                 │
│  • Scope Validation                                 │
├─────────────────────────────────────────────────────┤
│  MICROSERVICES / Neural Processing                  │
│  • Resource Controller                              │
│  • Data Model                                       │
│  • Error Handling                                   │
├─────────────────────────────────────────────────────┤
│  DATABASE / Memory Storage                          │
│  • Data Persistence Layer                           │
│  • Statelessness → ability to regenerate/restart    │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/ahmedabbas52233-a11y/Internship-Project-2.git
cd Internship-Project-2

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

---

## 📡 API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System pulse check |

### Users
| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| GET | `/api/users` | List all users | 200 |
| GET | `/api/users/:id` | Get single user | 200, 400, 404 |
| POST | `/api/users` | Create user | 201, 400, 409 |

### Posts
| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| GET | `/api/posts` | List all posts | 200 |
| POST | `/api/posts` | Create post | 201, 400, 404 |

### Contact (Connects to Project 1)
| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/api/contact` | Submit contact form | 201, 400 |

---

## 📊 HTTP Status Codes Implemented

| Code | Meaning | When Used |
|------|---------|-----------|
| **200** | OK | Successful GET requests |
| **201** | Created | Successful POST requests |
| **400** | Bad Request | Validation errors, malformed data |
| **401** | Unauthorized | Authentication required (Project 4) |
| **403** | Forbidden | Permission denied (Project 4) |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate data (e.g., email) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server errors |

---

## 🛡️ Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| Helmet | `helmet()` | Security headers |
| CORS | `cors()` | Cross-origin protection |
| Rate Limiting | `express-rate-limit` | Circuit breaker / DDoS protection |
| Input Validation | Custom validators | "Never trust the client" |
| Error Handling | Global middleware | Error resilience |

---

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Expected output:
# ✓ GET /api/health
# ✓ GET /api/users
# ✓ GET /api/users/:id
# ✓ POST /api/users
# ✓ POST /api/contact
# ✓ 404 handler
```

---

## 📁 File Structure

```
part2-backend-api/
├── server.js           # Main application entry
├── server.test.js      # API test suite
├── package.json        # Dependencies & scripts
├── .env.example        # Environment template
└── README.md           # This file
```

---

## 🔗 Connection to Project 1

Your Project 1 frontend contact form can now submit to:

```javascript
// In your Project 1 script.js
fetch('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
```

---

## 🎓 Learning Outcomes

1. **RESTful Naming** — Resource-based endpoint design
2. **HTTP Methods** — GET (safe/idempotent), POST (unsafe/non-idempotent)
3. **Status Codes** — Semantic communication of state
4. **JSON** — Lightweight, machine-parsable, human-readable
5. **Validation** — "Never trust the client" — syntactic + semantic validation
6. **Security** — AuthN, AuthZ, circuit breakers, rate limiting
7. **Documentation** — OpenAPI/Swagger specs (future)

---

## 🔜 Project 3 Roadmap

**Next Phase:** Database Integration

| Topic | Description |
|-------|-------------|
| MongoDB / PostgreSQL | Persistent data storage |
| Mongoose / Prisma | ORM/ODM layer |
| Migrations | Schema versioning |
| Seeding | Test data generation |

---

<p align="center">
  <strong>Build with integrity. Validate everything. Communicate clearly. Respect the architecture.</strong>
</p>
