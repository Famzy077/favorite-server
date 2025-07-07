# 🔌 Favvorite plug – Backend API

This repository contains the backend server for the **Favvorite plug** application — a powerful RESTful API built with **Node.js**, **Express**, and **Prisma ORM**. It handles everything from user authentication to product management and admin operations.

---

## 🚀 Features

- **Authentication**
  - Secure JWT-based registration & login
  - Email verification flow
  - Password reset support

- **User Management**
  - Admin-only access to view, block, and unblock users

- **Product Management**
  - Full CRUD support for products (Admin only)
  - File/image uploads using Multer

- **Admin Dashboard**
  - Get real-time stats and data for dashboard control panel

- **RBAC**
  - Role-Based Access Control (USER / ADMIN)

---

## 🛠 Tech Stack

| Tech           | Usage                         |
|----------------|-------------------------------|
| **Express.js** | Backend framework             |
| **Node.js**    | Runtime environment           |
| **PostgreSQL** | Primary database              |
| **Prisma ORM** | Type-safe DB interaction      |
| **JWT**        | Authentication mechanism      |
| **Multer**     | File uploads                  |
| **bcrypt.js**  | Password hashing              |

---

## ⚙️ Getting Started

### ✅ Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL (local or cloud)
- Redis (for verification codes)
- Postman (for testing)

### 📦 Installation

```bash
git clone <your-repo-url>
cd <repository-name>
npm install 
```

### 🔐 Environment Variables
Create a .env file in the root directory:

``` bash DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
JWT_SECRET="your_strong_jwt_secret_key"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

REDIS_HOST="your-redis-host.com"
REDIS_PORT="your-redis-port"
REDIS_USERNAME="your-redis-username"
REDIS_PASSWORD="your-redis-password" 
```

### 🧱 Database Migration
``` bash
npx prisma migrate dev
```

###▶️ Start Server
``` bash
npm run dev
```
Server runs at: http://localhost:5000

### 📖 API Endpoints
## 🔐 Authentication – /api/auth
- • Send Verification Code
- POST /api/auth/send-code
``` bash
{
  "email": "user@example.com"
}
```

## • Verify Code
- POST /api/auth/verify-code

``` bash
{
  "email": "user@example.com",
  "code": "123456"
}
```

## • Sign-up
- POST /api/auth/create-account

``` bash
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

## • Login
- POST /api/auth/login

``` bash
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Forgot Password
- POST /api/auth/forgot-password

``` bash
{
  "email": "user@example.com"
}
```

### 👤 User Details – /api/user-details
- • Get My Details
``` bash
GET /api/user-details/me
Authorization: Bearer <token>
```

- • Update My Details

- PUT /api/user-details
```
Authorization: Bearer <token>
```

``` bash
{
  "fullName": "Xavier Plug",
  "phone": "08012345678",
  "address": "123 Favvorite plug Blvd"
}
```

###📦 Products – /api/products
- • Get All Products

``` bash
GET /api/products
```

- • Get Single Product
``` bash
GET /api/products/:id
```

- • Create Product (Admin only)
``` bash
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| name        | string | ✅        |
| price       | number | ✅        |
| oldPrice    | number | ❌        |
| description | string | ✅        |
| category    | string | ✅        |
| quantity    | number | ✅        |
| image       | file   | ✅        |


- • Update Product (Admin only)
``` bash
PUT /api/products/:id
Authorization: Bearer <admin-token>
```
- • Delete Product (Admin only)
``` bash
DELETE /api/products/:id
Authorization: Bearer <admin-token>
```

## 🛡️ Admin Routes – /api/admin
- Requires ADMIN role

- • Get Dashboard Stats
``` bash
GET /api/admin/stats
Authorization: Bearer <admin-token>
```
- • Get All Users
```
GET /api/admin/users
Authorization: Bearer <admin-token>
```

- • Block/Unblock User
``` bash
PUT /api/admin/users/:id/toggle-block
Authorization: Bearer <admin-token>
```

### 🧪 Testing Tools
- You can test all routes using Postman or Thunder Client. Just make sure to set the Authorization header with your JWT token where required.

## 🙌 Contributing
If you'd like to contribute:

Fork this repo 🍴

Create your feature branch  ``` (git checkout -b feature/feature-name)```

Commit your changes ```(git commit -m "feat: add cool feature")```

Push to the branch ```(git push origin feature/feature-name)```

Open a Pull Request ✅

## 🧑‍💻 Author
Made with ❤️ by ``` Akinola Femi ```
Feel free to connect or collaborate!
``` bash
No: +234- 9132438978 
Email: [akinolafemi573@gmail.com](mailto:akinolafemi573@gmail.com)
```

## 📜 License
``` MIT ```
