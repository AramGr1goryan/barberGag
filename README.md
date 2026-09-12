# Gagik Ghambaryan — Luxury Men's Grooming Platform

A complete, production-ready full-stack web application for a premier luxury barbershop, featuring an editorial cinematic client experience and an executive management suite.

Built with **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL 18**, **Prisma ORM**, **Tailwind CSS**, and **Framer Motion**.

---

## 1. Key Architectural Features

- **Closed-by-Default Calendar Engine**:
  Every calendar day is strictly closed by default. No slot can be reserved unless the master barber explicitly opens the date and generates working slots from the administrative console.
- **Enforced Three-Hour Booking Rule**:
  Server-side restriction prevents any customer (by phone or user account) from reserving conflicting appointments within a 3-hour (180-minute) window.
- **Two-Phase SMS Verification & Concurrency Safety**:
  Reservations are held as `PENDING_VERIFICATION` with cryptographically salted SHA-256 OTP hashes. Transactional row-level updates prevent simultaneous double-booking of any slot.
- **Returning Visitor Session Intelligence**:
  Returning clients in the same session are automatically presented with their active appointment status, enabling instant rescheduling or cancellation without exposing database IDs (IDOR protection).
- **First-Class Multilingual Architecture**:
  Native support for **Armenian (Հայերեն)**, **Russian (Русский)**, and **English**, with authentic Eastern Armenian typography and localized date/currency formatting.
- **Live Theme & Content Engine**:
  The master barber can customize website colors, button silhouettes, and copy in all three languages through the admin panel without CSS injection risks.

---

## 2. Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Database**: PostgreSQL 18 with Prisma ORM
- **Styling**: Tailwind CSS with dynamic CSS variables
- **Animations**: Framer Motion with hardware-accelerated transforms & `prefers-reduced-motion`
- **Security**: Argon2id/Bcrypt password hashing, JOSE JWTs, SameSite HTTP-only cookies, sliding-window rate limiting
- **Testing**: Vitest automated unit & integration test suite

---

## 3. Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+
- **PostgreSQL**: v15+ or v18+ running on `localhost:5432`

### Installation
```bash
# 1. Clone or navigate to the repository
cd c:\barber

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy .env.example to .env and adjust as needed:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barber_db?schema=public"
AUTH_SECRET="luxury_barbershop_production_secret_key_32bytes_min_length_value"
BUSINESS_TIMEZONE="Asia/Yerevan"
SMS_PROVIDER="console" # Dev mode prints verification codes to terminal
```

### Database Synchronization & Seed
```bash
# Push schema to PostgreSQL
npx prisma db push

# Populate with realistic seed data (Admin, Services, Addons, Portfolio, Theme, Content)
npm run db:seed
```

### Development Server
```bash
npm run dev
# Public site: http://localhost:3000
# Admin login: http://localhost:3000/admin/login
```

---

## 4. Default Credentials (Development Seed)

- **Administrator**:
  - **Email**: `admin@barbershop.am`
  - **Phone**: `+37491000001`
  - **Password**: `Admin123!`
  - **Portal URL**: `/admin/login`
- **Demo Customer**:
  - **Email**: `client@barbershop.am`
  - **Phone**: `+37491000002`
  - **Password**: `Client123!`

---

## 5. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launch Next.js local development server |
| `npm run build` | Compile production bundle with zero type errors |
| `npm run start` | Run compiled production server |
| `npm run test` | Run automated Vitest test suite |
| `npm run db:push` | Synchronize Prisma schema with PostgreSQL |
| `npm run db:seed` | Seed database with initial catalog, theme, and admin |

---

## 6. Running Tests

```bash
npm run test
```
Covers:
1. Three-hour booking restriction business rule
2. Closed-by-default calendar logic
3. SMS OTP generation, expiration, and cryptographic salt hashing
4. Password hashing & JWT session verification
5. Armenian phone normalization and Zod schema security

---

## 7. Production Deployment

### Production Checklist
1. Set `SMS_PROVIDER="twilio"` and provide `SMS_ACCOUNT_ID`, `SMS_AUTH_TOKEN`, and `SMS_FROM`.
2. Generate a secure 64-character secret for `AUTH_SECRET`.
3. Provide production PostgreSQL credentials in `DATABASE_URL`.
4. Run `npm run build` followed by `npm run start` (or deploy directly via Vercel/Railway/Render).
