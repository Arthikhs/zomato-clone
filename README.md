# Zomato Clone — Full Stack Food Delivery App

A full-stack food delivery application built with a microservices architecture. Inspired by Zomato.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend Services | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.IO |
| Message Queue | RabbitMQ (CloudAMQP) |
| File Uploads | Cloudinary |
| Payments | Razorpay / Stripe |
| Authentication | JWT, Google OAuth 2.0 |
| Maps | Leaflet + Leaflet Routing Machine |
| Notifications | Twilio (SMS) |
| Containerization | Docker |

---

## Project Structure

```
Zomato Clone/
├── frontend/                  # React + Vite client app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level page components
│   │   ├── context/           # React context (App state, Socket)
│   │   ├── utils/             # Helper utilities (order flow)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── types.ts           # Shared TypeScript types
│   ├── .env                   # Frontend environment variables
│   └── package.json
│
└── services/
    ├── auth/                  # Auth Service         — PORT 5000
    ├── restaurant/            # Restaurant Service   — PORT 5001
    ├── utils/                 # Utils Service        — PORT 5002
    ├── realtime/              # Realtime Service     — PORT 5004
    ├── rider/                 # Rider Service        — PORT 5005
    └── admin/                 # Admin Service        — PORT 5006
```

Each backend service follows this internal structure:

```
services/<name>/
├── src/
│   ├── config/        # DB connection, RabbitMQ, etc.
│   ├── controllers/   # Route handler logic
│   ├── middlewares/   # Auth / internal key guards
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express routers
│   └── index.ts       # Service entry point
├── .env               # Service environment variables (never committed)
├── Dockerfile
└── package.json
```

---

## Services Overview

### Auth Service (PORT 5000)
Handles user registration, login, JWT issuance, and Google OAuth.

**Routes:** `/api/auth/*`

### Restaurant Service (PORT 5001)
Manages restaurants, menu items, cart, addresses, and orders. Consumes payment events from RabbitMQ.

**Routes:** `/api/restaurant/*`, `/api/item/*`, `/api/cart/*`, `/api/address/*`, `/api/order/*`

### Utils Service (PORT 5002)
Handles Cloudinary image uploads and payment processing (Razorpay/Stripe). Publishes payment events to RabbitMQ.

**Routes:** `/api/*`, `/api/payment/*`

### Realtime Service (PORT 5004)
Manages Socket.IO connections for live order tracking and rider location updates.

**Routes:** `/api/v1/internal/*` (internal only)

### Rider Service (PORT 5005)
Handles rider registration, order assignment, and delivery flow. Consumes order-ready events from RabbitMQ.

**Routes:** `/api/rider/*`

### Admin Service (PORT 5006)
Dashboard APIs for platform analytics, sales data, restaurant management.

**Routes:** `/api/v1/*`

---

## How Order Flow Works

1. User places order → **Restaurant Service** creates order
2. User proceeds to payment → **Utils Service** creates Razorpay/Stripe session
3. Payment success → **Utils Service** publishes to `payment_event` queue
4. **Restaurant Service** consumes event → marks order as paid
5. Restaurant marks order ready → publishes to `order_ready_queue`
6. **Rider Service** consumes event → notifies available riders
7. Rider accepts → location updates streamed via **Realtime Service** (Socket.IO)
8. User and restaurant track live via map (Leaflet)

---

## Prerequisites

- Node.js v18+
- npm v9+
- MongoDB Atlas account
- CloudAMQP account (RabbitMQ)
- Cloudinary account
- Razorpay or Stripe account
- Google Cloud OAuth 2.0 credentials
- (Optional) Twilio account for SMS

---

## Environment Variables

**Never commit `.env` files.** Create them manually in each service folder.

### `services/auth/.env`
```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SEC=<your_jwt_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```

### `services/restaurant/.env`
```env
PORT=5001
MONGO_URI=<your_mongodb_connection_string>
JWT_SEC=<your_jwt_secret>
UTILS_SERVICE=http://localhost:5002
REALTIME_SERVICE=http://localhost:5004
INTERNAL_SERVICE_KEY=<your_internal_key>
RABBITMQ_URL=<your_cloudamqp_url>
PAYMENT_QUEUE=payment_event
RIDER_QUEUE=rider_queue
ORDER_READY_QUEUE=order_ready_queue
TWILIO_ACCOUNT_SID=<your_twilio_sid>
TWILIO_AUTH_TOKEN=<your_twilio_token>
TWILIO_PHONE_NUMBER=<your_twilio_number>
```

### `services/utils/.env`
```env
PORT=5002
CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUD_API_KEY=<your_cloudinary_api_key>
CLOUD_SECRET_KEY=<your_cloudinary_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
FRONTEND_URL=http://localhost:5173
RESTAURANT_SERVICE=http://localhost:5001
INTERNAL_SERVICE_KEY=<your_internal_key>
RABBITMQ_URL=<your_cloudamqp_url>
PAYMENT_QUEUE=payment_event
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
```

### `services/realtime/.env`
```env
PORT=5004
JWT_SEC=<your_jwt_secret>
INTERNAL_SERVICE_KEY=<your_internal_key>
```

### `services/rider/.env`
```env
PORT=5005
MONGO_URI=<your_mongodb_connection_string>
JWT_SEC=<your_jwt_secret>
UTILS_SERVICE=http://localhost:5002
REALTIME_SERVICE=http://localhost:5004
RESTAURANT_SERVICE=http://localhost:5001
INTERNAL_SERVICE_KEY=<your_internal_key>
RABBITMQ_URL=<your_cloudamqp_url>
RIDER_QUEUE=rider_queue
ORDER_READY_QUEUE=order_ready_queue
```

### `services/admin/.env`
```env
PORT=5006
MONGO_URI=<your_mongodb_connection_string>
JWT_SEC=<your_jwt_secret>
DB_NAME=Zomato_Clone
```

### `frontend/.env`
```env
VITE_AUTH_SERVICE=http://localhost:5000
VITE_RESTAURANT_SERVICE=http://localhost:5001
VITE_RIDER_SERVICE=http://localhost:5005
VITE_REALTIME_SERVICE=http://localhost:5004
VITE_ADMIN_SERVICE=http://localhost:5006
VITE_INTERNAL_SERVICE_KEY=<your_internal_key>
VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your_repo_url>
cd zomato-clone
```

### 2. Install dependencies for all services

Run this in each of the 6 service folders and the frontend:

```bash
# Example — repeat for auth, restaurant, utils, realtime, rider, admin
cd services/auth
npm install

cd ../restaurant
npm install

# ... and so on

cd ../../frontend
npm install
```

### 3. Create `.env` files

Copy the environment variable templates above into each respective folder and fill in your values.

### 4. Run all services (development mode)

Open a separate terminal for each service and the frontend:

```bash
# Terminal 1 — Auth
cd services/auth && npm run dev

# Terminal 2 — Restaurant
cd services/restaurant && npm run dev

# Terminal 3 — Utils
cd services/utils && npm run dev

# Terminal 4 — Realtime
cd services/realtime && npm run dev

# Terminal 5 — Rider
cd services/rider && npm run dev

# Terminal 6 — Admin
cd services/admin && npm run dev

# Terminal 7 — Frontend
cd frontend && npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## Docker Setup (per service)

Each service has a `Dockerfile`. To build and run a single service:

```bash
cd services/auth
docker build -t zomato-auth .
docker run -p 5000:5000 --env-file .env zomato-auth
```

---

## Deployment

The project is deployed on [Render](https://render.com):

| Service | URL |
|---|---|
| Auth | https://zomato-auth.onrender.com |
| Restaurant | https://zomato-restaurant.onrender.com |
| Rider | https://zomato-rider.onrender.com |
| Realtime | https://zomato-realtime.onrender.com |
| Admin | https://zomato-admin-zxfj.onrender.com |

Frontend is deployed on [Vercel](https://vercel.com).

---

## Key Features

- User registration & login (Email/Password + Google OAuth)
- Browse restaurants and menu items
- Add to cart and place orders
- Razorpay & Stripe payment integration
- Real-time order tracking on map (Leaflet)
- Rider dashboard with live location sharing
- Admin sales analytics dashboard
- Role-based access: User / Restaurant Owner / Rider / Admin
- Image uploads via Cloudinary
- SMS notifications via Twilio
- Event-driven communication via RabbitMQ





## Key Features

- User registration & login (Email/Password + Google OAuth)
- Browse restaurants and menu items
- Add to cart and place orders
- Razorpay & Stripe payment integration
- Real-time order tracking on map (Leaflet)
- Rider dashboard with live location sharing
- Admin sales analytics dashboard
- Role-based access: User / Restaurant Owner / Rider / Admin
- Image uploads via Cloudinary
- SMS notifications via Twilio
- Event-driven communication via RabbitMQ
