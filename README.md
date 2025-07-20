# 🚀 React + Clerk Template

<div align="center">

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

**A modern, production-ready React template with Clerk authentication, TypeScript, and beautiful UI components.**


</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Security**
- ✅ **Clerk Authentication** - Complete auth solution
- ✅ **Protected Routes** - Route guards with React Router v7
- ✅ **User Management** - Profile, sessions, and more
- ✅ **Security Rules** - ESLint security plugin integration

</td>
<td width="50%">

### ⚡ **Modern Tech Stack**
- ✅ **React 19** - Latest React with concurrent features
- ✅ **TypeScript** - Full type safety and IntelliSense
- ✅ **Vite** - Lightning fast build tool
- ✅ **React Router v7** - Data router pattern

</td>
</tr>
<tr>
<td width="50%">

### 🎨 **UI & Styling**
- ✅ **Tailwind CSS 4** - Utility-first CSS framework
- ✅ **shadcn/ui** - Beautiful, accessible components
- ✅ **Dark/Light Mode** - Theme switching with persistence
- ✅ **Responsive Design** - Mobile-first approach

</td>
<td width="50%">

### 🛠️ **Developer Experience**
- ✅ **React Hook Form** - Performant forms with validation
- ✅ **ESLint + Prettier** - Code formatting and linting
- ✅ **SOLID Principles** - Clean architecture patterns
- ✅ **Hot Module Replacement** - Instant development feedback

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** (or **yarn**/pnpm)
- **Git** for version control

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/vedaterenoglu/reactjs-clerk-template.git
cd reactjs-clerk-template

# Install dependencies
npm install
```

### 2️⃣ Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your Clerk keys to .env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
VITE_APP_NAME=React + Clerk Template
VITE_APP_URL=http://localhost:3061
```

### 3️⃣ Start Development

```bash
# Start the development server
npm run dev

# Your app will be available at http://localhost:3061
```

---

## 📁 Project Structure

```
src/
├── 📁 components/          # Reusable UI components
│   ├── 📁 auth/           # Authentication components
│   ├── 📁 layout/         # Layout components (Navbar, Footer)
│   ├── 📁 providers/      # Context providers
│   └── 📁 ui/             # shadcn/ui components
├── 📁 routes/             # Page components
├── 📁 lib/                # Utility functions and configs
├── 📁 styles/             # Global styles and themes
├── 📄 router.tsx          # React Router v7 configuration
├── 📄 Layout.tsx          # Main layout component
└── 📄 App.tsx             # Root application component
```

---

## 🎯 Available Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | 🌐 Public | Home page with authentication status |
| `/authenticated` | 🔒 Protected | User dashboard (requires login) |

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server on port 3061
npm run preview      # Preview production build

# Building
npm run build        # Build for production
npm run typecheck    # Run TypeScript compiler

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

---

## 🎨 Customization

### Theme Configuration
The project uses a sophisticated theming system with CSS variables and Tailwind CSS:

- **Colors**: Defined in `src/styles/globals.css`
- **Components**: All UI components support theming automatically
- **Mode Toggle**: Users can switch between light, dark, and system themes

### Adding New Routes
1. Create your page component in `src/routes/`
2. Add the route to `src/router.tsx`
3. Use `<ProtectedRoute>` wrapper for authenticated routes

### Form Handling
Built-in form management with React Hook Form:
```tsx
import { useForm } from 'react-hook-form'
// Your form logic here
```

---

## 🏗️ Architecture Principles

This template follows **SOLID principles** and **React 19 best practices**:

- ✅ **Single Responsibility** - Each component has one clear purpose
- ✅ **Separation of Concerns** - Logic separated from presentation
- ✅ **Dependency Injection** - Props and context for loose coupling
- ✅ **Component Composition** - Building complex UIs from simple parts

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Vedat Erenoglu**
- Website: [vedaterenoglu.com](https://vedaterenoglu.com)
- LinkedIn: [@vedaterenoglu](https://www.linkedin.com/in/vedaterenoglu/)
- Email: info@vedaterenoglu.com

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Vedat Erenoglu](https://vedaterenoglu.com)

</div>