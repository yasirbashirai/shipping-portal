# Unified Shipping & Order Management Portal

A production-ready shipping portal for two Magento 2 cabinet e-commerce websites (cabinets.deals and northvillecabinetry.com). Fetches real-time LTL freight rates from 4 carriers, provides a checkout widget for customer rate selection, and a unified admin dashboard for order and customer management.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js 20 + Express.js 4
- **Database:** PostgreSQL 15 + Prisma ORM 5
- **Carriers:** XPO, R+L Carriers, SEFL (SOAP), FedEx Freight
- **Testing:** Vitest + React Testing Library + Playwright

## Project Structure

```
shipping-portal/
  packages/
    api/              # Express backend + carrier integrations
    checkout-widget/  # React widget for Magento checkout
    admin-dashboard/  # React admin SPA
  magento-module/     # Magento 2 PHP module
```

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 15 (or use Docker)
- npm or yarn

### Setup

```bash
# 1. Clone and install dependencies
cd packages/api && npm install
cd ../checkout-widget && npm install
cd ../admin-dashboard && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start database (Docker)
docker compose up postgres -d

# 4. Run migrations and seed
cd packages/api
npx prisma migrate dev
npx prisma db seed

# 5. Start development servers
npm run dev          # API on :3001
cd ../admin-dashboard && npm run dev    # Admin on :5173
cd ../checkout-widget && npm run dev    # Widget on :5174
```

### Running Tests

```bash
cd packages/api && npm test
cd packages/checkout-widget && npm test
cd packages/admin-dashboard && npm test
```

### Admin Login (Seeded)

- **Owner:** admin@dotlessagency.com / Admin@12345
- **Staff:** staff@dotlessagency.com / Staff@12345

## API Documentation

Swagger UI available at `http://localhost:3001/api/docs` when the API server is running.

---

*Dotless Agency - yasirbashir.com*
