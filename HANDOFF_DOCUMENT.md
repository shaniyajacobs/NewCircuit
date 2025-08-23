# NewCircuit - Project Handoff Document

## 🚀 Project Overview

**NewCircuit** is a modern React-based dating/social networking application built with React 17, Firebase, and TailwindCSS. The application features user authentication, matchmaking algorithms, event management, business partnerships, and admin functionality.

**Live URL:** https://mld.ng/

## 🏗️ Architecture Overview

### Frontend Stack
- **React 17** - Main UI framework
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Firebase** - Backend-as-a-Service (Authentication, Firestore, Storage, Functions)
- **Stripe** - Payment processing
- **Context API** - State management

### Backend Stack
- **Firebase Functions** - Serverless backend functions
- **Node.js 18** - Runtime environment
- **Firestore** - NoSQL database
- **Firebase Auth** - User authentication
- **Firebase Storage** - File storage

## 📁 Project Structure

```
NewCircuit/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Admin/          # Admin-specific components
│   │   ├── Business/       # Business user components
│   │   ├── Dashboard/      # User dashboard components
│   │   ├── Navbar/         # Navigation components
│   │   └── ...            # Other UI components
│   ├── pages/              # Page-level components
│   ├── contexts/           # React Context providers
│   ├── utils/              # Utility functions
│   ├── images/             # Static image assets
│   └── firebaseConfig.js   # Firebase configuration
├── functions/               # Firebase Cloud Functions
├── public/                  # Public assets
└── package.json            # Dependencies and scripts
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd NewCircuit
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install Firebase Functions dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Set up Firebase environment**
   ```bash
   firebase login
   firebase use circuit-eb73c
   ```

5. **Start development server**
   ```bash
   npm start
   ```

6. **Start Firebase emulators (optional)**
   ```bash
   firebase emulators:start
   ```

## 🔑 Environment Configuration

### Firebase Configuration
The app uses Firebase with the following services:
- **Project ID:** circuit-eb73c
- **Authentication:** Enabled
- **Firestore:** NoSQL database
- **Storage:** File storage
- **Functions:** Serverless backend

### Required Environment Variables
The following secrets need to be configured in Firebase Functions:
- `STRIPE_SECRET` - Stripe API secret key
- `REMO_API_KEY` - Remo API key for events
- `REMO_COMPANY_ID` - Remo company identifier
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password

### Stripe Configuration
- **Live Key:** pk_live_51REM95LgZqiosvkbaTHHl20wxFjRNEVJ1xs3T3htfGH3AmUekBLp1PyyjHhdSxEiMqOCjjmxSqH8PMohpHVUBZln003ObBv1Eh
- **Environment:** Production (live keys are configured)

## 🎯 Core Features

### 1. User Authentication & Profiles
- User registration and login
- Email/phone verification
- Profile management
- Password reset functionality

### 2. Matchmaking System
- Personality quiz-based matching
- Algorithm-driven compatibility scoring
- User preference management
- Connection management

### 3. Event Management
- Integration with Remo API for virtual events
- Event registration and management
- Location-based event discovery

### 4. Business Features
- Business user accounts
- Coupon management
- Analytics dashboard
- Partnership management

### 5. Admin Panel
- User management
- Business oversight
- Analytics and reporting
- System configuration

### 6. Payment Processing
- Stripe integration for payments
- Subscription management
- Payment history tracking

## 🔄 Key Workflows

### User Onboarding
1. User registration
2. Email/phone verification
3. Personality quiz completion
4. Profile setup
5. Preference configuration

### Matchmaking Process
1. Algorithm processes user data
2. Generates compatibility scores
3. Presents potential matches
4. User interaction and connection

### Event Participation
1. Browse available events
2. Register for events
3. Receive Remo integration details
4. Participate in virtual events

## 🗄️ Database Schema

### Main Collections
- `users` - User profiles and authentication data
- `profiles` - Extended user profile information
- `events` - Event data and registrations
- `connections` - User matchmaking connections
- `businesses` - Business account information
- `coupons` - Promotional offers
- `payments` - Transaction records

### Key Data Models
- User profiles with preferences and quiz results
- Event registrations with Remo integration
- Connection status and interaction history
- Business partnerships and analytics

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
firebase deploy --only hosting
```

### Functions Deployment
```bash
cd functions
npm run deploy
```

### Environment Management
- Production: `firebase use circuit-eb73c`
- Development: Use Firebase emulators locally

## 🧪 Testing

### Available Test Scripts
```bash
npm test                    # Run Jest tests
npm run test:coverage      # Run tests with coverage
```

### Test Files
- `src/components/Hero.test.js`
- `src/components/SlidingBar.test.js`
- `src/utils/test-gender-filter.js`
- `src/utils/test-red-dots.js`

## 🔍 Key Components

### Core Components
- **App.js** - Main application component with routing
- **NavBar** - Navigation component
- **Dashboard** - User dashboard with multiple pages
- **AdminDashboard** - Administrative interface
- **BusinessHome** - Business user interface

### Context Providers
- **ProfileContext** - User profile state management
- Authentication state management via Firebase

## 📱 Responsive Design

### Breakpoints (TailwindCSS)
- **Mobile:** 744px+ (`sm`)
- **Tablet:** 1280px+ (`md`) 
- **Desktop:** 1440px+ (`lg`)

### Design System
- Custom color palette with `mindaro-light`
- Typography scale from h1 (64px) to h8 (16px)
- Consistent spacing system (xxs to xxl)
- Bricolage Grotesque and Poppins fonts

## 🔌 External Integrations

### APIs & Services
- **Firebase** - Backend services
- **Stripe** - Payment processing
- **Remo** - Virtual event platform
- **EmailJS** - Contact form handling
- **Notiflix** - Notifications
- **AOS** - Scroll animations

### Third-Party Libraries
- **React Leaflet** - Map functionality
- **Chart.js** - Data visualization
- **Luxon** - Date/time handling
- **React Beautiful DnD** - Drag and drop

## 🚨 Known Issues & Technical Debt

### Current Issues
- Some test files reference deprecated patterns
- Firebase configuration has hardcoded API keys
- Mixed usage of Firebase v8 and v9 syntax in some areas

### Areas for Improvement
- Upgrade to React 18+ for latest features
- Implement proper TypeScript for better type safety
- Add comprehensive error boundaries
- Implement proper loading states throughout
- Add comprehensive unit and integration tests

## 📚 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TailwindCSS utility classes
- Implement proper error handling
- Add loading states for async operations

### File Naming
- Components: PascalCase (e.g., `UserProfile.js`)
- Utilities: camelCase (e.g., `formatDate.js`)
- CSS modules: ComponentName.module.css

### State Management
- Use React Context for global state
- Local state with useState for component-specific data
- Firebase real-time listeners for data synchronization

## 🔐 Security Considerations

### Authentication
- Firebase Auth handles user authentication
- Protected routes with PrivateRoute component
- Role-based access control for admin/business features

### Data Security
- Firestore security rules control data access
- User data isolation
- Admin-only access to sensitive operations

## 📊 Performance & Optimization

### Current Optimizations
- Image preloading for location images
- Lazy loading of components
- Firebase offline persistence
- Optimized bundle splitting

### Monitoring
- Firebase Analytics integration
- Performance monitoring via Firebase
- Error tracking and logging

## 🆘 Troubleshooting

### Common Issues
1. **Firebase connection errors** - Check API keys and project configuration
2. **Stripe payment failures** - Verify secret keys and webhook configuration
3. **Remo API timeouts** - Check API key and company ID
4. **Build failures** - Ensure Node.js version compatibility

### Debug Tools
- Firebase console for backend debugging
- Browser dev tools for frontend issues
- Firebase emulators for local development

## 📞 Support & Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### Team Contacts
- Previous developer: [Contact information needed]
- Project stakeholders: [Contact information needed]

## 🎯 Next Steps for New Team

### Immediate Actions
1. Review and understand the codebase structure
2. Set up development environment
3. Familiarize with Firebase console and configuration
4. Review existing test coverage

### Short-term Goals
1. Fix any critical bugs or issues
2. Implement missing error handling
3. Add comprehensive logging
4. Improve test coverage

### Long-term Vision
1. Plan React 18+ upgrade
2. Consider TypeScript migration
3. Implement comprehensive monitoring
4. Optimize performance bottlenecks

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Prepared By:** [Your Name]  
**Next Review:** [Date + 3 months]

---

*This document should be updated as the project evolves and new team members join.* 