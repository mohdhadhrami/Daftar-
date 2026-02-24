# Security Checklist & Compliance

## Authentication & Authorization

- [x] JWT tokens with short expiry (15 minutes)
- [x] Refresh token rotation
- [x] bcrypt password hashing (cost factor 12)
- [x] Password complexity requirements
- [x] Role-Based Access Control (RBAC)
- [x] Permission-based fine-grained control
- [x] 2FA-ready structure (TOTP secret field)
- [x] Account lockout after failed attempts (via rate limiting)

## Multi-Tenant Security

- [x] PostgreSQL Row-Level Security (RLS)
- [x] Company ID validation middleware
- [x] Tenant context injection via middleware
- [x] User-company membership verification
- [x] Cross-tenant data access prevention
- [x] WebSocket room isolation per tenant
- [x] AI service tenant isolation (no cross-tenant data in prompts)

## OWASP Top 10 Compliance

| # | Vulnerability | Mitigation |
|---|---------------|------------|
| A01 | Broken Access Control | RBAC, RLS, tenant middleware |
| A02 | Cryptographic Failures | bcrypt, JWT secrets, HTTPS |
| A03 | Injection | Prisma ORM (parameterized queries), input validation |
| A04 | Insecure Design | Defense in depth, principle of least privilege |
| A05 | Security Misconfiguration | Helmet headers, CORS config, no debug in prod |
| A06 | Vulnerable Components | Regular npm audit, dependency updates |
| A07 | Auth Failures | JWT best practices, refresh token rotation |
| A08 | Data Integrity Failures | Input validation, audit logging |
| A09 | Logging Failures | Structured logging, audit trail |
| A10 | SSRF | Input sanitization, no arbitrary URL fetching |

## API Security

- [x] Input validation (class-validator on all DTOs)
- [x] Request size limits (Nginx: 10MB)
- [x] Rate limiting (global + auth-specific)
- [x] CORS configuration (whitelist origins)
- [x] Secure headers (Helmet: X-Frame-Options, CSP, etc.)
- [x] No sensitive data in error responses
- [x] UUID for all IDs (no sequential integers)

## Database Security

- [x] Connection via SSL in production
- [x] Separate database user for application
- [x] RLS policies on all tenant tables
- [x] Audit log immutability (database triggers)
- [x] Parameterized queries via Prisma ORM
- [x] Encryption at rest (AWS RDS)

## AI Security

- [x] Input sanitization before sending to OpenAI
- [x] Tenant data isolation in AI prompts
- [x] Fallback logic when AI service is unavailable
- [x] No raw financial data sent to AI (only summaries)
- [x] Prompt injection prevention (input cleaning)
- [x] Rate limiting on AI endpoints

## Infrastructure Security

- [x] Docker non-root user
- [x] Multi-stage Docker builds (no dev dependencies in prod)
- [x] Nginx reverse proxy
- [x] SSL/TLS termination at load balancer
- [x] Private subnets for database and cache
- [x] Security groups limiting inter-service traffic
- [x] Environment-based configuration (no hardcoded secrets)

## Financial Data Integrity

- [x] Double-entry accounting enforcement
- [x] SUM(debit) = SUM(credit) validation
- [x] Immutable posted journal entries
- [x] Fiscal period locking
- [x] Optimistic locking (version field)
- [x] Reversing entries for voids (no deletion)
- [x] Complete audit trail
