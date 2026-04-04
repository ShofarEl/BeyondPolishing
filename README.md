# Beyond Polishing: AI-Powered Data Science Problem Framing

<div align="center">

![Beyond Polishing Logo](https://img.shields.io/badge/Beyond-Polishing-blue?style=for-the-badge&logo=brain&logoColor=white)

**A research application exploring how different AI prompt styles affect students' data science problem-framing abilities**

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)

[🚀 Live Demo](#) • [📖 Documentation](#documentation) • [🔬 Research](#research-overview) • [🛠️ Setup](#quick-start)

</div>

---

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🔬 Research Overview](#-research-overview)
- [📱 User Interface](#-user-interface)
- [🔒 Security](#-security)
- [🧪 Testing](#-testing)
- [📊 Data Collection](#-data-collection)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Project Overview

**Beyond Polishing** is a research-focused web application that investigates how different AI assistance styles impact students' ability to frame WiFi infrastructure data science problems effectively. The application implements Chisom Onwumere's thesis research on AI feedback styles in educational contexts, using a fixed WiFi infrastructure seed problem to ensure consistent comparison across participants.

### Research Question
*How do different AI prompt styles (Editor vs. Challenger modes) affect the creativity, feasibility, and reasoning quality of students' WiFi infrastructure problem statements?*

### Study Focus
All participants work with the same seed problem: **"Predict down usage to scale router upgrade"** - allowing researchers to study how different AI prompting styles lead to different creative reframings of the same base problem.

### Key Innovation
- **Editor Mode**: Refinement-focused AI that polishes and clarifies problem statements
- **Challenger Mode**: Creative AI that proposes alternative problem framings and challenges assumptions

---

## ✨ Features

### 🤖 AI-Powered Assistance
- **Dual AI Modes**: Editor (refinement) and Challenger (counter-proposal) prompting
- **WiFi-Focused Context**: Specialized prompts for network infrastructure problems
- **OpenAI Integration**: GPT-3.5-turbo for cost-effective, high-quality responses
- **Context-Aware**: AI considers user input and WiFi infrastructure domain

### 👥 User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Intuitive Interface**: Clean, academic-focused UI with serif typography
- **Real-time Feedback**: Instant AI responses and interaction tracking
- **Progress Tracking**: Dashboard with comprehensive statistics

### 🔬 Research Features
- **Anonymous Data Collection**: IRB-compliant participant tracking
- **Comprehensive Logging**: All interactions, timings, and user feedback
- **Study Group Management**: Randomized assignment to Editor-first or Challenger-first groups
- **Rating System**: User feedback on AI response quality

### 🔒 Security & Privacy
- **Secure Authentication**: JWT-based user sessions
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Privacy Protection**: Participant anonymization and consent management

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | Modern, fast development and build |
| **State Management** | Zustand | Lightweight, intuitive state management |
| **Styling** | Tailwind CSS | Utility-first, responsive design |
| **Typography** | Google Fonts | Academic serif fonts (Libre Baskerville, EB Garamond) |
| **Backend** | Node.js + Express | RESTful API server |
| **Database** | MongoDB Atlas | Cloud-hosted document database |
| **AI Integration** | OpenAI GPT-3.5-turbo | Natural language processing |
| **Authentication** | JWT | Secure, stateless authentication |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0+ 
- npm or yarn
- MongoDB Atlas account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/beyond-polishing.git
   cd beyond-polishing
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (frontend + backend)
   npm run install-all
   
   # Or install separately
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment  
   cp frontend/.env.example frontend/.env
   ```

4. **Configure environment variables** (see [Configuration](#-configuration))

5. **Start development servers**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

---

## 📁 Project Structure

```
beyond-polishing/
├── 📁 frontend/                 # React application
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable UI components
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── AIResponseCard.jsx # AI response display
│   │   │   ├── TaskCard.jsx    # Problem task cards
│   │   │   └── ProgressChart.jsx # Data visualization
│   │   ├── 📁 pages/           # Route components
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Dashboard.jsx   # User dashboard
│   │   │   ├── ProblemWorkspace.jsx # Main workspace
│   │   │   └── Profile.jsx     # User profile
│   │   ├── 📁 store/           # State management
│   │   │   ├── authStore.js    # Authentication state
│   │   │   ├── problemStore.js # Problem data state
│   │   │   └── aiStore.js      # AI interaction state
│   │   ├── 📁 services/        # API services
│   │   └── 📁 utils/           # Utility functions
│   ├── package.json
│   └── vite.config.js
├── 📁 backend/                  # Node.js/Express API
│   ├── 📁 routes/              # API endpoints
│   │   ├── auth.js             # Authentication routes
│   │   ├── problems.js         # Problem management
│   │   ├── ai.js               # AI interaction routes
│   │   └── admin.js            # Admin/research routes
│   ├── 📁 models/              # Database schemas
│   │   ├── User.js             # User model
│   │   └── Problem.js          # Problem model
│   ├── 📁 services/            # Business logic
│   │   └── aiService.js        # OpenAI integration
│   ├── 📁 middleware/          # Express middleware
│   │   ├── auth.js             # Authentication middleware
│   │   └── validation.js       # Input validation
│   ├── server.js               # Main server file
│   └── package.json
├── 📁 docs/                     # Documentation
├── 📄 README.md
└── 📄 package.json             # Root package.json
```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beyond-polishing

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Create `frontend/.env` with:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Environment
VITE_NODE_ENV=development
```

---

## 🔬 Research Overview

### Study Design
- **Participants**: Data science students and professionals
- **Duration**: ~30 minutes per participant
- **Design**: Between-subjects randomized controlled trial
- **Groups**: Editor-first vs. Challenger-first
- **Seed Problem**: "Predict down usage to scale router upgrade" (consistent across all participants)

### Data Collection
- **Problem Statements**: Initial and refined versions
- **AI Interactions**: All prompts and responses
- **User Ratings**: Feedback on AI response quality
- **Timing Data**: Time spent on each task
- **Demographics**: Academic level, experience

### Evaluation Metrics
- **Creativity**: Novelty and originality of problem framings
- **Feasibility**: Technical and practical viability
- **Reasoning Quality**: Logical structure and justification

---

## 📱 User Interface

### Key Screens

#### 🏠 Home Page
- Project introduction and study information
- Participant registration and login
- Responsive design with compact layout

#### 📊 Dashboard
- Task overview and progress tracking
- Recent AI interactions display
- Study group information
- Real-time statistics

#### 🛠️ Problem Workspace
- Split-screen layout (50/50)
- Problem statement editor
- AI mode selection (Editor/Challenger)
- Interaction history sidebar

#### 👤 Profile Page
- Participant information
- Activity summary with real-time stats
- Study group details
- Account management

### Design Principles
- **Academic Focus**: Serif typography for readability
- **Mobile-First**: Responsive design for all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Clean Interface**: Minimal distractions for focus

---

## 🔒 Security

### Authentication
- JWT-based stateless authentication
- Secure password hashing with bcrypt
- Session management and token refresh

### Data Protection
- HTTPS encryption for all communications
- Environment variable protection for API keys
- Input validation and sanitization
- Rate limiting to prevent abuse

### Privacy Compliance
- Anonymous participant tracking
- IRB-approved data collection protocols
- GDPR-compliant data handling
- Secure data storage and transmission

---

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test

# End-to-end tests
npm run test:e2e
```

### Test Coverage
- Unit tests for core functionality
- Integration tests for API endpoints
- Component tests for UI interactions
- End-to-end tests for user workflows

---

## 📊 Data Collection

### Research Data
- **Anonymous Tracking**: Participant IDs without personal information
- **Interaction Logs**: All AI prompts and responses
- **Performance Metrics**: Task completion times and success rates
- **User Feedback**: Ratings and qualitative feedback

### Data Export
```bash
# Export research data (admin only)
npm run export-data

# Generate analytics reports
npm run generate-reports
```

---

## 🚀 Deployment

### Production Setup

1. **Backend Deployment** (Render)
   ```bash
   # Build and deploy backend
   cd backend
   npm run build
   npm run start
   ```

2. **Frontend Deployment** (Vercel/Netlify)
   ```bash
   # Build and deploy frontend
   cd frontend
   npm run build
   npm run preview
   ```

3. **Environment Configuration**
   - Update API URLs for production
   - Configure CORS for production domains
   - Set up monitoring and logging

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-cluster...
FRONTEND_URL=https://your-domain.com
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm run test
   ```
5. **Submit a pull request**

### Code Standards
- ESLint configuration for consistent code style
- Prettier for automatic code formatting
- Conventional commits for clear history
- Component documentation with JSDoc

### Research Ethics
- All contributions must maintain IRB compliance
- Participant privacy must be protected
- Data collection protocols must be followed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

### Research Team
- **Principal Investigator**: [Name]
- **Developer**: [Your Name]
- **Institution**: [University/Organization]

### Support
- 📧 Email: support@beyond-polishing.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/beyond-polishing/issues)
- 📖 Documentation: [Wiki](https://github.com/your-username/beyond-polishing/wiki)

---

<div align="center">

**Built with ❤️ for advancing AI-assisted education research**

[⬆ Back to Top](#beyond-polishing-ai-powered-data-science-problem-framing)

</div>