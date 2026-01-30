# Compliance Management System - Design Document

## 1. System Overview

### 1.1 Architecture Style
**Decision:** Monorepo with separate frontend and backend applications
**Rationale:** 
- Enables independent scaling and deployment
- Maintains shared types for consistency
- Simplifies dependency management with PNPM workspaces
- Clear separation of concerns while keeping related code together

### 1.2 Technology Choices

**Frontend: Angular + TypeScript**
- Mature enterprise framework with strong typing
- Angular Material provides consistent, accessible UI components
- MSAL library for Microsoft authentication integration
- Built-in dependency injection and routing

**Backend: NestJS + TypeScript**
- Enterprise-grade Node.js framework with modular architecture
- Native TypeScript support with decorators
- Built-in dependency injection, guards, and interceptors
- Excellent integration with Prisma ORM and scheduling

**Database: PostgreSQL (Supabase)**
- ACID compliance for transactional integrity
- Strong relational model for complex data relationships
- JSON support for flexible configuration storage
- Supabase provides managed hosting with connection pooling

**ORM: Prisma**
- Type-safe database queries
- Automatic migration generation
- Prevents SQL injection through parameterized queries
- Excellent TypeScript integration

