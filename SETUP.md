# RentShield: Local Setup & PostgreSQL Integration

This guide will help you get the RentShield backend environment up and running on your local machine.

## 📋 Prerequisites
- **Node.js**: v18 or higher.
- **PostgreSQL**: v14 or higher.
- **Redis**: (Optional) Used for caching. If not available, set `REDIS_ENABLED=false` in `.env`.

---

## 🛠️ Step 1: PostgreSQL Configuration

### 1. Create the Database
Ensure your PostgreSQL server is running, then create a new database named `rentshield`:
```sql
CREATE DATABASE rentshield;
```

### 2. Manual Initialization (Optional)
If you wish to seed the initial schema manually, you can run the provided SQL scripts:
- `init.sql`: Creates the base schema and core seed data.
- `reinit.sql`: Drops everything and reinstalls a fresh copy.

---

## ⚙️ Step 2: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update the `DATABASE_URL` in `.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/rentshield"
   ```

---

## 🚀 Step 3: Application Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Sync Database Schema**:
   Use Prisma to synchronize the latest schema modifications including all new Legal, Finance, and Society models:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000/api`.

---

## 🧪 Testing & Review (2FA)

RentShield uses a mandatory 2-stage authentication system.

### The Master Key
For development and review purposes, you can use the universal OTP:
- **Code**: `123456`
- This code will bypass actual email delivery for all users (`LOGIN` and `PASSWORD_RESET`).

---

## 📖 Useful Documents
- **Main Index**: [docs/README.md](./docs/README.md)
- **API Reference**: [Swagger UI](http://localhost:4000/api/docs)
- **Postman Collection**: [RentShield_Master_Collection.postman_collection.json](./RentShield_Master_Collection.postman_collection.json)
