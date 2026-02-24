# Daftar - Production Deployment Guide (AWS)

## Architecture Overview

```
Internet
    |
    v
[Route 53 DNS]
    |
    v
[Application Load Balancer (ALB)]
    |-- HTTPS (443) --> [ECS Service: Nginx]
    |                      |-- /api/* --> [ECS Service: Backend]
    |                      |-- /ws/*  --> [ECS Service: Backend]
    |                      |-- /*     --> [ECS Service: Frontend]
    |
[RDS PostgreSQL (Multi-AZ)]
    |
[ElastiCache Redis]
```

## AWS Services Required

| Service | Purpose |
|---------|---------|
| ECS Fargate | Container orchestration |
| RDS PostgreSQL | Database (Multi-AZ) |
| ElastiCache Redis | Caching & sessions |
| ALB | Load balancing & SSL termination |
| ECR | Docker image registry |
| Route 53 | DNS management |
| ACM | SSL certificates |
| CloudWatch | Logging & monitoring |
| Secrets Manager | Secret storage |
| S3 | Static assets & backups |
| VPC | Network isolation |

## Deployment Steps

### 1. VPC & Networking
- Create VPC with public and private subnets across 2+ AZs
- NAT Gateway for private subnet internet access
- Security groups for each service tier

### 2. Database (RDS)
```bash
aws rds create-db-instance \
  --db-instance-identifier daftar-db \
  --db-instance-class db.r6g.large \
  --engine postgres \
  --engine-version 15 \
  --master-username daftar_admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name <subnet-group>
```

After creation, run migrations:
```bash
psql -h <rds-endpoint> -U daftar_admin -d daftar_db -f database/migrations/001_initial_schema.sql
psql -h <rds-endpoint> -U daftar_admin -d daftar_db -f database/migrations/002_rls_policies.sql
```

### 3. Redis (ElastiCache)
```bash
aws elasticache create-replication-group \
  --replication-group-id daftar-redis \
  --replication-group-description "Daftar Redis Cache" \
  --engine redis \
  --cache-node-type cache.r6g.large \
  --num-cache-clusters 2
```

### 4. Container Registry (ECR)
```bash
aws ecr create-repository --repository-name daftar/backend
aws ecr create-repository --repository-name daftar/frontend
aws ecr create-repository --repository-name daftar/nginx
```

### 5. Build & Push Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t daftar/backend ./backend
docker tag daftar/backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/daftar/backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/daftar/backend:latest

docker build -t daftar/frontend ./frontend
docker tag daftar/frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/daftar/frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/daftar/frontend:latest
```

### 6. ECS Task Definitions & Services
Create task definitions with environment variables from AWS Secrets Manager.

### 7. SSL Certificate
```bash
aws acm request-certificate \
  --domain-name daftar.yourdomain.com \
  --validation-method DNS
```

### 8. Application Load Balancer
- HTTPS listener on 443 with ACM certificate
- HTTP listener on 80 redirecting to HTTPS
- Target groups for backend and frontend

## Environment Variables (Secrets Manager)

Store these in AWS Secrets Manager:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `REDIS_HOST` / `REDIS_PORT`

## Security Checklist

- [ ] HTTPS enforced on all endpoints
- [ ] RDS in private subnet (no public access)
- [ ] Redis in private subnet
- [ ] Security groups restrict inter-service traffic
- [ ] Secrets in AWS Secrets Manager (not env vars)
- [ ] RDS encryption at rest enabled
- [ ] RDS automated backups enabled
- [ ] CloudWatch alarms for critical metrics
- [ ] WAF rules on ALB
- [ ] VPC Flow Logs enabled

## Monitoring

- CloudWatch Logs for all ECS tasks
- CloudWatch metrics for RDS, Redis, ECS
- Custom dashboards for business metrics
- Alerts for: high error rates, DB connection pool, Redis memory, CPU/memory

## Backup Strategy

- RDS: Automated daily backups, 30-day retention
- Point-in-time recovery enabled
- Monthly snapshot exports to S3
- Redis: Daily snapshots

## Scaling

- ECS auto-scaling based on CPU/memory
- RDS read replicas for reporting queries
- Redis cluster mode for high-throughput caching
- ALB connection draining enabled
