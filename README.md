# DhaqsoPay Backend API

Node.js/Express API implementing the endpoints defined in the DhaqsoPay guide. MongoDB is used for persistence and Twilio for SMS verification.

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint                          | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/auth/register`                  | Register a new user          |
| POST   | `/auth/login`                     | Login and receive JWT token  |
| POST   | `/auth/send-verification`         | Send phone verification code |
| POST   | `/auth/verify-phone`              | Verify SMS code              |
| POST   | `/auth/skip-verification`         | Dev-only skip                |
| GET    | `/auth/profile`                   | Get current profile          |
| PUT    | `/auth/profile`                   | Update profile               |
| POST   | `/auth/change-password`           | Update password              |
| GET    | `/accounts`                       | List linked accounts         |
| POST   | `/accounts`                       | Add account                  |
| DELETE | `/accounts/:id`                   | Remove account               |
| GET    | `/accounts/:id/balance`           | Retrieve balance             |
| POST   | `/transactions`                   | Create transfer              |
| GET    | `/transactions`                   | List transactions            |
| GET    | `/transactions/:id`               | Transaction detail           |
| POST   | `/transactions/calculate-fee`     | Fee calculator               |
| GET    | `/data/providers`                 | Telecom providers            |
| GET    | `/data/packages`                  | Data packages (auth)         |
| POST   | `/data/purchase`                  | Start data purchase          |
| GET    | `/purchases/channels`             | List supported payment rails |
| GET    | `/purchases`                      | User purchase requests       |
| POST   | `/purchases`                      | Create USDT purchase request |
| GET    | `/purchases/:id`                  | Purchase detail              |
| PATCH  | `/purchases/:id/proof`            | Submit payment proof         |
| PATCH  | `/purchases/:id/cancel`           | Cancel pending request       |
| GET    | `/purchases/admin/all` (admin)    | Admin view of all purchases  |
| PATCH  | `/purchases/:id/status` (admin)   | Update purchase status       |
| GET    | `/wallets`                        | List saved USDT wallets      |
| POST   | `/wallets`                        | Save new USDT wallet address |
| PATCH  | `/wallets/:id`                    | Update label/default status  |
| DELETE | `/wallets/:id`                    | Remove saved wallet          |

## Getting Started

```bash
cd server
cp .env.example .env
# Update values in .env (Mongo URI, JWT secret, USDT rate, Twilio credentials)
npm install
npm run dev
```

### Testing

```bash
npm test
```

## Project Structure

```
server
├── src
│   ├── app.js               # Express app factory
│   ├── server.js            # Bootstrap script
│   ├── config/database.js   # Mongo connection helper
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth + error middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Router modules
│   ├── utils/               # Logger, token, SMS helpers
│   └── data/                # Static telecom/data definitions
└── tests                    # Vitest + Supertest suites (add later)
```

## Notes

- When Twilio credentials are absent, SMS messages are mocked and logged to the console.
- Fee calculations use a 1.1% rate, matching the mobile app logic.
- Ensure your MongoDB instance is running and reachable before starting the server.
- `DEFAULT_USDT_RATE` controls the fallback fiat → USDT conversion when a rate is not provided by the client.
- Registration now accepts optional `country` and `preferredCurrency` fields so users can be onboarded for new African markets.
- USDT payouts are sent exclusively over the Tron (TRC20) network and include a configurable processing fee (`PURCHASE_FEE_PERCENT`, default 3%).
- `/wallets` endpoints allow customers to save, update, and remove TRC20 payout addresses; purchase requests accept either a saved `walletId` or a custom address.
