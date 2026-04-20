# Module: Finance & Vault

The Finance module is the economic engine of RentShield, managing a high-integrity ledger of all rental transactions, partial payments, and automated financial reports.

## 💰 Financial Ledger System

RentShield uses a **Ledger Entry** system to ensure 100% financial transparency between landlords and tenants.

### Ledger Fundamentals
- **Credit (CREDIT)**: Any inbound payment from a tenant that reduces their balance.
- **Debit (DEBIT)**: Any invoice, maintenance charge, or penalty that increases the balance due.
- **Auto-Balancing**: Every payment transaction automatically triggers a matching ledger entry.

---

## 💳 Payment Processing Logic

The payment engine (`/api/payments`) supports flexible rental workflows:

### 1. Partial Payment Algorithm
Users are not forced to pay the full amount due.
```text
If (userInputAmount < balanceDue) {
  Status = PARTIALLY_PAID
  NewBalance = balanceDue - userInputAmount
} else {
  Status = COMPLETED
  NewBalance = 0
}
```

### 2. Auto-Receipt Generation
Upon any payment status change to `COMPLETED` or `PARTIALLY_PAID`, the system generates a digital receipt:
- **Timestamped ID**: Unique transaction reference.
- **PDF Streaming**: Receipts are stored and streamed directly to the frontend for download.
- **Stamp Duty Mock**: For finalized tenancies, the receipt integrates a "Processed" stamp duty watermark.

---

## 🏛️ E-Stamping & Registration

For legal compliance, the platform provides a mock E-Stamping workflow:
1. **Signing Phase**: Tenant and Landlord must both sign effectively (`status: SIGNED`).
2. **Registration Trigger**: Landlord initiates "Registration".
3. **Identifier Assignment**: System generates a unique government-style `stampingId`.
4. **Watermarking**: Adds a digital "Registered & Stamped" overlay to the document.

## 🖥️ Frontend Integration Playbook
1. **Live Balance**: Always pull `GET /payments/due` to show the "Pay Now" banner in the dashboard.
2. **Ledger UI**: Use a data table to list `LedgerEntry` items, clearly color-coding Credits (Green) and Debits (Red).
3. **PDF Handlers**: Use `Blob` response handling in the frontend to trigger the receipt download dialog.
