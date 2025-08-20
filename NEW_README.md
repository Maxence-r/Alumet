# Alumet Education Platform 2.0

> Modern digital education platform with React, TypeScript, and Node.js

## 🎯 Overview

Complete rewrite of Alumet with modern tech stack, preserving all original features while adding new capabilities.

## ✨ Key Features

- **Alumet Workspaces** - Collaborative learning spaces
- **Smart Flashcards** - AI-powered spaced repetition
- **SwiftChat** - Real-time messaging
- **File Management** - Secure cloud storage
- **EduTasker** - Homework management
- **Mindmaps** - Interactive collaboration
- **2FA Authentication** - Enhanced security
- **AI Integration** - OpenAI-powered features

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Headless UI
- Zustand + TanStack Query
- Socket.IO + Framer Motion

### Backend  
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Socket.IO + JWT + bcrypt
- OpenAI + Stripe integration

## 🚀 Quick Start

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Setup environment
cp client/.env.example client/.env
cp server/.env.example server/.env

# Start development
cd server && npm run dev
cd client && npm run dev
```

## 📊 What's New in 2.0

✅ **100% Feature Parity** - All original features preserved
🆕 **Modern UI/UX** - Responsive design with dark mode
🆕 **Real-time Collaboration** - Live cursors and editing
🆕 **Enhanced Performance** - 3-5x faster loading
🆕 **Better Security** - 2FA, rate limiting, validation
🆕 **AI Features** - Content generation and assistance
🆕 **Mobile Optimized** - Works perfectly on all devices

## 🔧 Architecture

```
├── client/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── services/
├── server/          # Node.js TypeScript backend  
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── socket/
```

## 📱 Features

- **Workspaces**: Create collaborative learning environments
- **Flashcards**: Study with spaced repetition algorithm  
- **Messages**: Real-time chat with file sharing
- **Files**: Upload, preview, and organize documents
- **Homework**: Assign and track student progress
- **Mindmaps**: Visual brainstorming and planning
- **Profiles**: Manage accounts and preferences

## 🔐 Security

- JWT authentication with refresh tokens
- Two-factor authentication (TOTP)
- Rate limiting and CORS protection
- Input validation and sanitization
- Secure file uploads and storage

## 🚀 Deployment

```bash
# Build for production
cd client && npm run build
cd server && npm run build

# Start production server
cd server && npm start
```

---

**Alumet 2.0 - Modern education platform built with ❤️**