# Xtube Backend

Xtube is a robust backend service for a **video streaming and social media platform**, built with **Node.js, Express, and MongoDB**. It mimics core features of platforms like YouTube and X (Twitter).

## 🚀 Features

- **User Management**: Regsitration, Login (JWT), Profile Management.
- **Video Management**: Upload videos (Cloudinary), Publish/Delete.
- **Social Interaction**: Likes, Comments, Tweets, Subscriptions.
- **Dashboard**: Creator stats and analytics.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Files**: Cloudinary
- **Auth**: JWT + Bcrypt

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=8000
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## 🏃‍♂️ Run Locally

1. `npm install`
2. `npm run dev`

## 🚀 Deploy to Vercel

Configured for Vercel serverless deployment (`api/index.js`).
