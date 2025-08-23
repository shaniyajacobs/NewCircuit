# NewCircuit - Project Handoff Document

## 🚀 Project Overview

**NewCircuit** is a modern React-based dating/social networking application built with React 17, Firebase, and TailwindCSS. The application features user authentication, matchmaking algorithms, event management, business partnerships, and admin functionality.

**Live URL:** https://www.circuitspeeddating.com

**Project Status:** Production-ready with ongoing development

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

### Database Schema
- **Firestore Collections:**
  - `users` - User profiles and authentication data
  - `profiles` - Extended user profile information
  - `events` - Event data and registrations
  - `connections` - User matchmaking connections
  - `businesses` - Business account information
  - `coupons` - Promotional offers
  - `payments` - Transaction records
  - `adminLogs` - Administrative actions
  - `notifications` - User notifications

## 📁 Project Structure

```
NewCircuit/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Admin/          # Admin-specific components
│   │   │   ├── AdminHelperComponents/  # Admin UI helpers
│   │   │   └── AdminPages/             # Admin page components
│   │   ├── Business/       # Business user components
│   │   │   ├── BusinessHelperComponents/  # Business UI helpers
│   │   │   └── BusinessPages/             # Business page components
│   │   ├── Dashboard/      # User dashboard components
│   │   │   ├── DashboardHelperComponents/  # Dashboard UI helpers
│   │   │   └── DashboardPages/             # Dashboard page components
│   │   ├── Navbar/         # Navigation components
│   │   ├── ContactPage/    # Contact form components
│   │   ├── FAQ/            # FAQ components
│   │   ├── HowItWorks/     # How it works components
│   │   ├── MapPage/        # Map and location components
│   │   ├── Matchmaking/    # Matchmaking algorithm components
│   │   └── ...             # Other UI components
│   ├── pages/              # Page-level components
│   ├── contexts/           # React Context providers
│   ├── utils/              # Utility functions
│   ├── images/             # Static image assets
│   └── firebaseConfig.js   # Firebase configuration
├── functions/               # Firebase Cloud Functions
├── public/                  # Public assets
├── storage.rules           # Firebase Storage security rules
├── firestore.rules         # Firestore security rules
├── firebase.json           # Firebase configuration
├── tailwind.config.js      # TailwindCSS configuration
└── package.json            # Dependencies and scripts
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI
- Git
- Modern web browser

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

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
```

## 🔑 Environment Configuration

### Firebase Configuration
The app uses Firebase with the following services:
- **Project ID:** circuit-eb73c
- **Authentication:** Enabled with email/password and phone verification
- **Firestore:** NoSQL database with real-time listeners
- **Storage:** File storage for user uploads
- **Functions:** Serverless backend functions
- **Hosting:** Static site hosting

### Required Environment Variables
The following secrets are already configured in Firebase Functions:
- `STRIPE_SECRET` - Stripe API secret key
- `REMO_API_KEY` - Remo API key for events
- `REMO_COMPANY_ID` - Remo company identifier
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password

### Local Development Environment
Create a `.env.local` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

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

### Full Deployment
```bash
firebase deploy
```

### Deployment Checklist
- [ ] Run tests locally
- [ ] Build frontend successfully
- [ ] Deploy functions
- [ ] Deploy hosting
- [ ] Verify live site functionality
- [ ] Check Firebase console for errors

## 🔍 Key Components & Features

### Core Components
- **App.js** - Main application component with routing
- **NavBar** - Navigation component with responsive design
- **Dashboard** - User dashboard with multiple pages
- **AdminDashboard** - Administrative interface with analytics
- **BusinessHome** - Business user interface


### **Key User Journey**:

1. **Sign Up** → Complete profile and preferences
2. **Take Quiz** → 17-question personality assessment
3. **Set Location** → Choose city for local events
4. **Browse Events** → View upcoming speed dating events
5. **Join Event** → Sign up and get added to Remo
6. **Attend Event** → Participate in virtual speed dating
7. **Submit Top 3 Ppl** - Submit who you wanted 
8. **View Matches** → See connections within 48 hours
9. **Organize Dates** → Plan in-person meetings with matches
10. **Upload Photos** → Both users upload 2 date photos
11. **Earn Coupons** → Unlock discounts after photo verification
12. **Redeem Coupons** → Use earned discounts at local businesses


### Context Providers
- **ProfileContext** - User profile state management
- Authentication state management via Firebase
- Real-time data synchronization

## 📱 Responsive Design & UI/UX

### Breakpoints (TailwindCSS)
- **Mobile:** 744px+ (`sm`)
- **Tablet:** 1280px+ (`md`) 
- **Desktop:** 1440px+ (`lg`)

### Design System
- Custom color palette with `mindaro-light`
- Typography scale from h1 (64px) to h8 (16px)
- Consistent spacing system (xxs to xxl)
- Bricolage Grotesque and Poppins fonts
- Modern, clean interface design

### UI Components
- Custom form components
- Modal dialogs
- Loading states
- Error boundaries
- Responsive tables
- Interactive maps

## 🔌 External Integrations

### APIs & Services
- **Firebase** - Backend services and real-time database
- **Stripe** - Payment processing and subscription management
- **Remo** - Virtual event platform integration
- **EmailJS** - Contact form handling
- **Notiflix** - User notifications and alerts
- **AOS** - Scroll animations and effects

### Third-Party Libraries
- **React Leaflet** - Map functionality and location services
- **Chart.js** - Data visualization and analytics
- **Luxon** - Date/time handling and formatting
- **React Beautiful DnD** - Drag and drop functionality
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework

## 📚 Development Guidelines

### Code Style & Standards
- Use functional components with hooks
- Follow React best practices and patterns
- Use TailwindCSS utility classes for styling
- Implement proper error handling and loading states
- Add comprehensive comments for complex logic
- Use consistent naming conventions

### File Naming Conventions
- Components: PascalCase (e.g., `UserProfile.js`)
- Utilities: camelCase (e.g., `formatDate.js`)
- CSS modules: ComponentName.module.css
- Pages: PascalCase (e.g., `Dashboard.js`)
- Contexts: PascalCase (e.g., `ProfileContext.js`)

### State Management
- Use React Context for global state
- Local state with useState for component-specific data
- Firebase real-time listeners for data synchronization
- Avoid prop drilling by using context appropriately

### Error Handling
- Implement try-catch blocks for async operations
- Use error boundaries for component-level error handling
- Provide user-friendly error messages
- Log errors for debugging purposes

## 🔐 Security Considerations

### Authentication & Authorization
- Firebase Auth handles user authentication
- Protected routes with PrivateRoute component
- Role-based access control for admin/business features
- JWT token validation
- Session management

### Data Security
- Firestore security rules control data access
- User data isolation and privacy
- Admin-only access to sensitive operations
- Input validation and sanitization
- CORS configuration

### API Security
- Rate limiting on Firebase Functions
- Input validation on all endpoints
- Secure environment variable handling
- HTTPS enforcement

## 🎯 **Main Pages & System Interactions**

### **User Authentication & Onboarding Flow**

#### **1. Sign Up Process (`CreateAccount.js`)**
- **Firebase Integration**: Uses Firebase Auth to create new user accounts
- **Data Storage**: Stores user profile in Firestore `users` collection
- **Profile Picture**: Uploads profile images to Firebase Storage
- **Validation**: Checks for existing email addresses before account creation
- **Onboarding Flow**: After signup, users are redirected to complete their profile

#### **2. Login Process (`Login.js`)**
- **Firebase Auth**: Authenticates users with email/password
- **User Verification**: Checks if user has completed all onboarding steps
- **Route Protection**: Redirects incomplete profiles to appropriate onboarding pages

#### **3. Personality Quiz (`PersonalityQuizPage.js`)**
- **17 Questions**: Comprehensive personality assessment covering:
  - Employment status, political views, lifestyle preferences
  - Relationship goals, communication style, conflict resolution
  - Love languages, emotional openness, partner preferences
- **Firebase Storage**: Saves quiz responses to user's subcollection `quizResponses`
- **Progress Tracking**: Tracks completion status in user profile
- **Required Step**: Users cannot access dashboard until quiz is complete

### **User Dashboard & Core Features**

#### **4. Main Dashboard (`Dashboard.js`)**
- **Protected Routes**: Only accessible after completing all onboarding steps
- **Navigation**: Sidebar with multiple dashboard sections
- **Route Structure**: 
  - `/dashboard/` - Home page with upcoming events
  - `/dashboard/dashMyConnections` - View and manage matches
  - `/dashboard/dashMyCoupons` - Access earned coupons
  - `/dashboard/dashMyProfile` - Profile management
  - `/dashboard/dashSettings` - Account settings

#### **5. Event Management & Remo Integration**
- **Event Discovery**: Browse upcoming speed dating events
- **Sign Up Process**: 
  1. User selects event from dashboard
  2. System checks event capacity and user's remaining dates
  3. **Firebase Transaction**: Updates event signup counts and user's date balance
  4. **Remo API Integration**: Automatically adds user to Remo virtual event
  5. **Event Tracking**: Stores event registration in user's `signedUpEvents` subcollection

#### **6. Matchmaking & Connections (`DashMyConnections.js`)**
- **48-Hour Rule**: Users can only see matches within 48 hours after event
- **Remo Integration**: Fetches event data and attendee lists from Remo API
- **Match Display**: Shows potential connections with profile information
- **Connection Management**: Users can accept/reject matches
- **Real-time Updates**: Firebase listeners for connection status changes

### **Coupon System & Date Management**

#### **7. Coupon Earning Process (`DashMyCoupons.js`)**
- **Two-Photo Requirement**: Both users must upload 2 photos from their date
- **Photo Verification**: System tracks photo uploads for each connection
- **Coupon Unlocking**: Once both users upload photos and Circuit verifies, coupons become available
- **Coupon Categories**: 
  - Business coupons (from admin-uploaded business offers)

#### **8. Coupon Redemption**
- **Available Coupons**: Users see all unlocked coupons
- **Redemption Process**: Users can redeem coupons for various discounts
- **Business Partnerships**: Coupons from local businesses and restaurants

### **Admin Dashboard (`AdminDashboard.js`)**

#### **9. Admin Management System**
- **Access Control**: Restricted to users in `adminUsers` collection
- **Business Management**: Add/edit/remove business accounts
- **Coupon Management**: Upload and manage business coupons
- **User Analytics**: Monitor user engagement and event participation
- **Event Oversight**: Manage event creation and monitoring

#### **10. Business Coupon Upload (`AdminCoupons.js`)**
- **Coupon Creation**: Admins can create coupons for existing businesses
- **Business Association**: Links coupons to specific business accounts
- **Validation**: Ensures business exists before coupon creation
- **Analytics**: Track coupon performance and redemption rates

### **Business Dashboard (`EnterpriseDash.js`)**

#### **11. Business User Interface**
- **Access Control**: Business users have separate dashboard
- **Coupon Management**: View and edit their business coupons
- **Analytics Dashboard**: Track coupon performance metrics
- **Profile Management**: Update business information and settings

#### **12. Business Analytics (`BusinessAnalytics.js`)**
- **Performance Metrics**: 
  - Total coupons created
  - Total redemptions
  - Active coupon count
  - Revenue tracking
- **Real-time Data**: Firebase listeners for live statistics
- **Business Insights**: Understand coupon effectiveness and user engagement

### **Data Flow & Integration Points**

#### **Firebase Collections Structure**:
- `users` - User profiles and authentication data
- `profiles` - Extended user information
- `events` - Event details and capacity management
- `connections` - User matchmaking data
- `coupons` - Business and date-earned coupons
- `businesses` - Business account information
- `adminUsers` - Admin access control

#### **Remo API Integration**:
- **Event Data**: Fetches event details, capacity, and timing
- **User Registration**: Automatically adds users to Remo events
- **Attendee Lists**: Retrieves participant information for matchmaking
- **Real-time Updates**: Syncs event status and participant data

#### **Stripe Integration**:
- **Payment Processing**: Handles premium feature purchases
- **Date Purchases**: Users can buy additional dates
- **Subscription Management**: Premium membership handling

---

*This document should be updated as the project evolves and new team members join. Please maintain version control and update timestamps accordingly.* 