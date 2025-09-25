---
description: Repository Information Overview
alwaysApply: true
---

# Actory Information

## Summary
Actory is a web-based film audition platform that connects actors with casting directors. The project consists of a React frontend and a Node.js/Express backend with MongoDB as the database.

## Repository Structure
- **actory-spotlight-ui**: React-based frontend application using Vite, TypeScript, and Tailwind CSS
- **actory-spotlight-backend**: Node.js/Express backend with MongoDB database
- **uploads**: Contains uploaded media files (photos, videos)
- **UML Diagrams2.pdf**, **actoryy_schema_diagram.pdf**, **Synopsis.pdf**: Documentation files

## Projects

### Frontend (actory-spotlight-ui)
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript/TypeScript with React
**Version**: React 18.3.1
**Build System**: Vite 5.4.19
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.3.1 with React DOM
- React Router DOM 6.30.1
- Axios 1.11.0
- Radix UI components
- TanStack React Query 5.83.0
- Tailwind CSS 3.4.17
- Zod 3.25.76

**Development Dependencies**:
- TypeScript 5.8.3
- ESLint 9.32.0
- Vite plugins for React
- Tailwind CSS tools

#### Build & Installation
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```

#### Main Files
**Entry Point**: src/main.jsx
**App Component**: src/App.jsx
**Key Directories**:
- src/components: UI components
- src/pages: Application pages
- src/hooks: Custom React hooks
- src/layouts: Page layouts
- scripts: Utility scripts for code conversion

### Backend (actory-spotlight-backend)
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js (version not specified)
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- Express 4.18.2
- Mongoose 8.17.1
- JWT 9.0.2
- Bcrypt 2.4.3
- Multer 2.0.2
- Nodemailer 7.0.6
- Cloudinary 1.41.3

**Development Dependencies**:
- Nodemon 3.0.2

#### Build & Installation
```bash
npm install
npm run dev    # Development with nodemon
npm start      # Production server
```

#### Main Files
**Entry Point**: server.js
**API Routes**: routes/*.js
**Controllers**: controllers/*.js
**Database Models**: models/*.js
**Database Config**: config/db.js

#### Database
**Type**: MongoDB
**Connection**: Mongoose ORM
**Models**:
- User.js
- CastingCall.js
- Message.js
- Video.js
- RoleSwitchRequest.js