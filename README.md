# Daftar - Multi-Tenant SaaS Accounting Platform

A production-grade, multi-tenant SaaS accounting web application with real-time collaboration and AI integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS (Browser)                        │
│  React + TypeScript + Redux Toolkit + WebSocket Client          │
└──────────────────────┬──────────────────┬───────────────────────┘
                       │ HTTPS            │ WSS
                       ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NGINX REVERSE PROXY                          │
│              SSL Termination / Rate Limiting                     │
└──────────────────────┬──────────────────┬───────────────────────┘
                       │                  │
                       ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NestJS APPLICATION                             │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────────┐  │
│  │  Auth    │ │Companies │ │Accounting │ │   AI Service       │  │
│  │  Module  │ │ Module   │ │  Engine   │ │(OpenAI Integration)│  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────────┐  │
│  │Invoice  │ │ Payment  │ │  Audit    │ │   WebSocket        │  │
│  │ Module  │ │ Module   │ │  Module   │ │   Gateway          │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │            TENANT MIDDLEWARE (company_id injection)         │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         SECURITY LAYER (Guards, Filters, Interceptors)     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┬────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│      PostgreSQL           │   │            Redis                  │
│  (RLS-Enabled)            │   │   (Cache / Sessions / Pub-Sub)   │
│  Multi-Tenant Isolation   │   │                                  │
└──────────────────────────┘   └──────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Backend        | NestJS, TypeScript, Prisma ORM          |
| Database       | PostgreSQL with Row-Level Security       |
| Cache          | Redis                                   |
| Real-time      | Socket.io                               |
| Frontend       | React, TypeScript, Redux Toolkit        |
| AI             | OpenAI API                              |
| Auth           | JWT + Refresh Token Rotation            |
| Infrastructure | Docker, Nginx, AWS-ready                |

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- Docker & Docker Compose

### Quick Start (Docker)
```bash
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

### Development Setup
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
- Database connection
- Redis connection
- JWT secrets
- OpenAI API key
- CORS origins

## Core Features

1. **Multi-Tenant Architecture** - Company-based isolation with PostgreSQL RLS
2. **Double-Entry Accounting** - Chart of Accounts, Journals, Trial Balance, Financial Statements
3. **Invoice & Payment Management** - Sales/Purchase invoices with auto-posting
4. **Real-Time Collaboration** - WebSocket rooms per tenant
5. **AI-Powered Assistant** - Expense categorization, anomaly detection, cash flow forecasting
6. **Audit Trail** - Immutable logging of all financial operations
7. **RBAC** - Owner, Admin, Accountant, Sales, Viewer roles

## Security

- JWT with refresh token rotation
- bcrypt password hashing
- Rate limiting
- Input validation (class-validator)
- CORS configuration
- Secure headers (Helmet)
- PostgreSQL Row-Level Security
- Tenant isolation at middleware + database level

## License

Proprietary - All rights reserved.
