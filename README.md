# E-commerce Ordering and Payment System - Backend


A robust Node.js/Express backend API for a full-featured e-commerce platform with integrated payment processing (Stripe & bKash), hierarchical category management, and Redis caching.

## 🔗 Quick Links

- **Live Demo**: [https://e-commerce-ordering-and-payment-sys-one.vercel.app](https://e-commerce-ordering-and-payment-sys-one.vercel.app)
- **Frontend Repo**: [GitHub](https://github.com/mohamim360/E-commerce-Ordering-and-Payment-System-Frontend)
- **Backend Repo**: [GitHub](https://github.com/mohamim360/E-commerce-Ordering-and-Payment-System)

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based authentication with role-based access control (USER, ADMIN)
- **Product Management**: CRUD operations with pagination, SKU validation, and stock tracking
- **Category Hierarchy**: Tree-based category system with DFS algorithm for recommendations
- **Order Management**: Secure order creation with atomic stock reduction and idempotency
- **Payment Integration**: Multi-provider payment system (Stripe & bKash)
- **Redis Caching**: Category tree caching for optimized performance

### Security Features
- Password hashing with bcrypt
- JWT token validation
- Role-based authorization
- SQL injection protection via Prisma ORM
- Webhook signature verification
- Idempotent payment processing

### Payment Providers
- **Stripe**: Credit/debit card payments with webhook support
- **bKash**: Mobile wallet integration for Bangladesh market

## 🛠️ Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Stripe SDK, bKash API
- **Validation**: Zod schemas
- **Security**: bcrypt, CORS

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Stripe Account (for card payments)
- bKash Merchant Account (for mobile payments)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mohamim360/E-commerce-Ordering-and-Payment-System.git
cd E-commerce-Ordering-and-Payment-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
SALT_ROUNDS=12

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# bKash Configuration
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_CALLBACK_URL=http://localhost:3000/payment/callback

# Admin Seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SuperSecret123!
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database with sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Build and start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t ecommerce-backend .

# Run container
docker run -p 5000:5000 --env-file .env ecommerce-backend
```

## 📁 Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Environment configuration
├── controllers/           # Route controllers
│   ├── AuthController.ts
│   ├── ProductController.ts
│   ├── OrderController.ts
│   ├── PaymentController.ts
│   └── CategoryController.ts
├── services/              # Business logic layer
│   ├── AuthServices.ts
│   ├── ProductService.ts
│   ├── OrderService.ts
│   ├── PaymentService.ts
│   ├── CategoryService.ts
│   └── RecommendationService.ts
├── repositories/          # Data access layer
│   ├── UserRepository.ts
│   ├── ProductRepository.ts
│   └── CategoryRepository.ts
├── strategies/            # Payment strategy pattern
│   ├── PaymentStrategy.ts
│   ├── StripeProvider.ts
│   └── BkashProvider.ts
├── middlewares/           # Express middlewares
│   ├── authMiddleware.ts
│   └── errorHandler.ts
├── dtos/                  # Zod validation schemas
│   ├── auth.schema.ts
│   ├── product.schema.ts
│   └── order.schema.ts
├── lib/                   # Utility libraries
│   └── prisma.ts
└── utils/                 # Helper functions
    ├── authUtils.ts
    └── redis.ts
```

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register          Register new user
POST   /auth/login             Login user
GET    /users/me               Get current user (protected)
```

### Products
```
GET    /products               Get all products (paginated)
GET    /products/:id           Get product by ID
POST   /products               Create product (admin)
PUT    /products/:id           Update product (admin)
DELETE /products/:id           Delete product (admin)
GET    /products/:id/recommendations  Get product recommendations
```

### Categories
```
POST   /categories             Create category (admin)
GET    /categories/:id/subtree Get category subtree IDs
```

### Orders
```
POST   /orders                 Create order (protected)
GET    /orders                 Get user orders (protected)
GET    /orders/:id             Get order details (protected)
```

### Payments
```
POST   /payments/checkout      Initiate payment (protected)
POST   /webhooks/stripe        Stripe webhook handler
POST   /api/v1/payments/bkash/execute    Execute bKash payment
GET    /api/v1/payments/bkash/query/:id  Query bKash status
```

### Admin
```
GET    /admin/users            Get all users (admin)
```

## 🧪 Testing

```bash
# Run tests (configure test script in package.json)
npm test

# Lint code
npm run lint

# Format code
npm run prettier:fix
```

## 📊 Database Schema

### Core Models
- **User**: Authentication and user management
- **Product**: Product catalog with SKU, price, stock
- **Category**: Hierarchical category tree
- **Order**: Order management with status tracking
- **OrderItem**: Individual order line items
- **Payment**: Payment transaction records

### Key Features
- UUID primary keys
- Decimal precision for monetary values
- Indexed foreign keys for performance
- Enum types for status fields
- JSON fields for metadata

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Password Policy**: Enforced via Zod validation (8+ chars, uppercase, number, special char)
3. **JWT Expiration**: Tokens expire after 7 days by default
4. **SQL Injection**: Protected via Prisma parameterized queries
5. **CORS**: Configure allowed origins in production
6. **Rate Limiting**: Consider adding rate limiting middleware
7. **Webhook Security**: Signature verification for payment webhooks

## 🚀 Deployment

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm run prod
```

---