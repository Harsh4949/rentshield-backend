# RentShield: Frontend Integration Guide

Welcome to the RentShield developer ecosystem. This guide provides the technical blueprint for integrating your frontend applications with our backend infrastructure.

## 🔐 Authentication & Authorization

RentShield uses **JWT (JSON Web Tokens)** for secure, stateless authentication.

### The Auth Flow
1. **Registration**: `POST /auth/register`. Note that users must choose a role (`TENANT`, `LANDLORD`, etc.).
2. **Login**: `POST /auth/login`. Returns a `token`.
3. **Usage**: Attach the token to the `Authorization` header of every request:
   ```http
   Authorization: Bearer <your_jwt_token>
   ```

### Role-Based Access Control (RBAC)
- The platform uses **Features** and **Capabilities**.
- Call `GET /auth/capabilities` to get a map of what the current user can do (e.g., `can: { "VIEW_PROPERTY": true }`).
- Call `GET /auth/ui-config` to get the module-to-route mapping if you are building a dynamic admin dashboard.

---

## 🏗️ Domain Modules

### 1. Property Discovery (`/api/properties`)
- **Geo-Search**: You can search by longitude/latitude and radius.
- **Leads**: Use the `interest` endpoints to link tenants to property owners.

### 2. Payment Vault (`/api/payments`)
- **Ledger**: Always pull `GET /payments/ledger/:tenancyId` for a full financial statement.
- **Partial Payments**: The `amount` field in the payment request body is optional; if omitted, it defaults to the full `balanceDue`.
- **Receipts**: The `receipt` endpoint returns a file stream. Use a "Download" anchor or `blob` conversion in the UI.

### 3. Local Expert Marketplace (`/api/experts`)
- **Verification**: Only show the "Verified" badge if `expert.isVerified` is `true`.
- **Automated Chat**: When a tenant calls `POST /experts/:id/book`, a chat session is automatically created. The response includes the `chatSessionId`.

---

## 💬 Real-time Communications (Socket.io)

We use Socket.io for chat and live notifications.

### Connection
Connect to the root URL. Ensure you emit the `join` event after authentication.

### Events
- `message`: Incoming chat message.
- `notification`: Live alerts for rent due, booking accepted, etc.

---

## 📈 State & Enums
Consistency is key. Use these exact string values for state management:

| Domain | Status Enum |
| :--- | :--- |
| **Tenancy** | `DRAFT`, `PENDING_APPROVAL`, `SIGNED`, `ACTIVE`, `ENDED` |
| **Payment** | `PENDING`, `PARTIALLY_PAID`, `COMPLETED`, `OVERDUE` |
| **Expert Booking** | `REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| **Dispute** | `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED` |

---

## 🛠️ Developer Tools

### Swagger UI
Our live documentation is located at `/api/docs`. Use this to test payloads and see detailed response schemas.

### Postman Collection
A pre-configured Postman collection is available in the repository at `artifacts/RentShield_Full_Collection.postman_collection.json`.
