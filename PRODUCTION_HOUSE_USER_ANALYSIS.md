# Production House / Producer User - Comprehensive Analysis

## 📋 Overview

A **Production House User** (also called Producer or Recruiter in the platform) represents a company or organization that creates casting calls to hire actors. The system supports two types of production users:

1. **Producer** - Individual producer role in User collection
2. **ProductionTeam** - Team-based producer role that manages multiple team members

There's also a **ProductionHouse** collection for legacy support, though the system is transitioning to use the unified User model.

---

## 🏗️ Architecture Overview

### Three Storage Models

The system uses a **three-tier approach** with production users stored in multiple locations:

1. **User Collection** - Modern approach, stores both Actors and Producers/ProductionTeams
2. **ProductionHouse Collection** - Legacy model for backward compatibility
3. **PendingProductionHouse Collection** - Temporary storage during registration
4. **ProductionTeam Collection** - Team management for production houses

### Key Transition
- **Legacy:** ProductionHouse was a separate collection
- **Current:** Producers are Users with `role: 'Producer'` or `role: 'ProductionTeam'`
- **Future:** Consolidate everything into User model

---

## 💾 Data Models

### ProductionHouse Model (Legacy) - `models/ProductionHouse.js`

```javascript
ProductionHouseSchema {
  // Company Information
  name: String (required, 2-100 chars)
  companyName: String (required)
  email: String (required, unique)
  phone: String (required, validated format)
  location: String (required)
  website: String (optional)
  
  // Authentication
  password: String (required, 6+ chars, bcrypt hashed)
  
  // Profile
  photo: String (optional)
  profileImage: String (optional)
  bio: String (max 500 chars)
  
  // Business Information
  establishedYear: Number (optional)
  teamSize: String enum[
    '1-10', 
    '11-50', 
    '51-200', 
    '201-500', 
    '500+'
  ]
  specializations: [String] // e.g., ['Film', 'TV', 'Web Series']
  
  // Verification
  isEmailVerified: Boolean (default: false)
  emailVerificationOTP: String
  emailVerificationOTPExpire: Date
  isVerified: Boolean (default: false)
  
  // Role
  role: String (default: 'ProductionTeam', enum: ['ProductionTeam'])
  
  // Password Reset
  resetPasswordToken: String
  resetPasswordExpire: Date
  
  // Timestamps
  createdAt: Date (default: Date.now)
}

// Methods
matchPassword(enteredPassword) // Compare passwords
getResetPasswordToken() // Generate 10-min reset token
getSignedJwtToken() // Sign JWT with 30-day expiry
```

### User Model (Modern) - `models/User.js`

```javascript
UserSchema {
  // Common Fields
  name: String (required, 2-50 chars)
  email: String (required, unique)
  password: String (required, 6+ chars)
  role: String enum['Actor', 'Producer', 'ProductionTeam', 'Admin']
  phone: String (conditionally required for Actor/Producer)
  location: String (conditionally required for Actor/Producer)
  
  // Email Verification
  isEmailVerified: Boolean (default: false)
  emailVerificationOTP: String
  emailVerificationOTPExpire: Date
  
  // Profile
  photo: String (default: '')
  profileImage: String
  bio: String (max 500 chars)
  
  // Actor-Specific
  age: Number (1-120)
  gender: String enum['male', 'female', 'other', 'prefer-not-to-say']
  experienceLevel: String enum['beginner', 'intermediate', 'experienced', 'professional']
  videos: [VideoSchema] // Embedded video array
  followers: [ObjectId] (ref: User)
  following: [ObjectId] (ref: User)
  
  // Producer-Specific
  companyName: String (required for Producer/ProductionTeam)
  website: String
  establishedYear: Number
  teamSize: String enum['1-10', '11-50', '51-200', '201-500', '500+']
  specializations: [String]
  
  // Verification
  isVerified: Boolean (default: false)
  
  // Password Management
  resetPasswordToken: String
  resetPasswordExpire: Date
  
  // Timestamps
  createdAt: Date (default: Date.now)
}

// Validations
- phone: Required for Actor/Producer roles
- location: Required for Actor/Producer roles
- companyName: Required for Producer/ProductionTeam roles
```

### PendingProductionHouse Model - `models/PendingProductionHouse.js`

```javascript
PendingProductionHouseSchema {
  // Company Information
  name: String (required, 2-100 chars)
  email: String (required, unique)
  password: String (required, 6+ chars)
  phone: String (required)
  location: String (required)
  companyName: String (required)
  website: String (optional)
  
  // OTP Verification
  emailVerificationOTP: String (required)
  emailVerificationOTPExpire: Date (required)
  
  // Auto-delete
  createdAt: Date (auto-delete after 10 minutes)
  
  // Note: NOT hashed here - hashed upon permanent storage
}
```

### PendingUser Model - `models/PendingUser.js`

```javascript
PendingUserSchema {
  // Common
  name: String (required, 2-50 chars)
  email: String (required, unique)
  password: String (required, NOT hashed in pending)
  role: String (Actor, Producer, ProductionTeam, Admin)
  phone: String (optional, for validation)
  location: String (optional, for validation)
  
  // Actor-Specific
  age: Number
  gender: String enum['male', 'female', 'other', 'prefer-not-to-say']
  experienceLevel: String
  bio: String
  profileImage: String
  
  // Producer-Specific
  companyName: String
  website: String
  
  // OTP Verification
  emailVerificationOTP: String (required)
  emailVerificationOTPExpire: Date (required)
  
  // Auto-delete
  createdAt: Date (auto-delete after 5 minutes)
}
```

### ProductionTeam Model - `models/ProductionTeam.js`

```javascript
ProductionTeamSchema {
  name: String (required, max 120 chars)
  description: String (max 500 chars)
  productionHouse: String (max 120 chars)
  
  // Ownership
  owner: ObjectId (ref: User, required)
  
  // Team Members
  members: [
    {
      user: ObjectId (ref: User, required)
      role: String enum['Owner', 'Recruiter', 'Viewer']
      addedAt: Date (default: Date.now)
    }
  ]
  
  // Timestamps
  timestamps: true (createdAt, updatedAt)
}

// Indices
- owner: 1
- members.user: 1
```

---

## 🛣️ API Routes & Authentication

### Auth Routes (`routes/auth.js`)

**Public Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/auth/register` | POST | Register user (role: 'Producer' or 'ProductionTeam') |
| `/api/v1/auth/login` | POST | Login as producer |
| `/api/v1/auth/google` | POST | Google OAuth login |
| `/api/v1/auth/verify-email` | POST | Verify email with OTP |
| `/api/v1/auth/resend-verification` | POST | Resend OTP |
| `/api/v1/auth/forgotpassword` | POST | Request password reset |
| `/api/v1/auth/resetpassword/:token` | PUT | Reset password |
| `/api/v1/auth/check-email` | GET | Check email availability |

**Protected Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/auth/me` | GET | Get current user profile |
| `/api/v1/auth/me` | PUT | Update current user |
| `/api/v1/auth/updatepassword` | PUT | Change password |
| `/api/v1/auth/me/photo` | PUT | Upload profile photo |

### Authentication Flow

```
Frontend                    Backend                     Database
   │                           │                            │
   ├─ POST /auth/register ─────>│                            │
   │  (name, email, password,  │                            │
   │   role: 'Producer',        │                            │
   │   companyName, phone,      │                            │
   │   location)                │                            │
   │                            │                            │
   │                            ├─ Validate input ───────────>│
   │                            │                            │
   │                            ├─ Hash password             │
   │                            │                            │
   │                            ├─ Generate OTP              │
   │                            │                            │
   │                            ├─ Create PendingUser ──────>│
   │                            │   (auto-delete in 5 min)  │
   │                            │                            │
   │<───── OTP via Email ───────┤                            │
   │                            ├─ Send email verification   │
   │                            │                            │
   │  POST /verify-email        │                            │
   ├─ (email, otp) ───────────>│                            │
   │                            │                            │
   │                            ├─ Check PendingUser ──────>│
   │                            │ ├─ Validate OTP            │
   │                            │ └─ Create User ───────────>│
   │                            │ ├─ Delete PendingUser ────>│
   │                            │                            │
   │<─────── JWT Token ─────────┤                            │
   │     + User Data            │                            │
   │                            │                            │
   └─ Store in localStorage     │                            │
```

---

## 🔑 Producer Registration Flow (Frontend)

### RegisterProducer Component (`src/pages/auth/RegisterProducer.jsx`)

**State Management:**
```javascript
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [companyName, setCompanyName] = useState("");
const [phone, setPhone] = useState(""); // 10-digit validation
const [location, setLocation] = useState("");
const [website, setWebsite] = useState(""); // Optional
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
```

**Validation Rules:**
- **Name:** 2-50 characters, cannot be blank
- **Email:** Valid email format, checked for availability
- **Password:** Min 6 characters, must match confirmation
- **Phone:** Exactly 10 digits, numeric only
- **Company Name:** Min 2 characters, required
- **Location:** Required
- **Website:** Optional, must be valid URL

**Registration Payload:**
```json
{
  "name": "John Smith",
  "email": "john@productionhouse.com",
  "password": "securePassword123",
  "role": "Producer",
  "companyName": "ABC Productions",
  "phone": "9876543210",
  "location": "Los Angeles, CA",
  "website": "https://abcproductions.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code.",
  "email": "john@productionhouse.com",
  "otp": "123456" // Only in development mode
}
```

**Post-Registration:**
- User redirected to `/auth/verify-email`
- OTP displayed in toast (dev mode)
- User enters OTP to complete registration
- Upon verification: Redirect to `/dashboard/producer`

---

## 🔐 Authentication Middleware (`middleware/auth.js`)

### protect() Middleware

Verifies JWT token and identifies user type:

```javascript
// Check JWT token
const token = req.headers.authorization?.split(' ')[1];

// Decode token
const decoded = jwt.verify(token, JWT_SECRET);

// If it's a ProductionHouse token (legacy)
if (decoded.type === 'ProductionHouse') {
  req.user = await ProductionHouse.findById(decoded.id);
  req.user.isProductionHouse = true;
}

// Otherwise, check User collection
else {
  req.user = await User.findById(decoded.id);
}

// Set isAdmin flag if user is Admin
if (req.user?.role === 'Admin') {
  req.user.isAdmin = true;
}
```

### authorize(...roles) Middleware

Checks if user has required role:

```javascript
authorize('Producer', 'ProductionTeam')(req, res, next)
// Allows only Producer or ProductionTeam roles
// Used on endpoints: create casting calls, review submissions, etc.
```

---

## 👨‍💼 Producer Capabilities

### What Producers Can Do

1. **Create Casting Calls**
   - Define role requirements
   - Set audition criteria
   - Specify skills needed
   - Add role descriptions

2. **Review Submissions**
   - View actor audition videos
   - Watch submissions multiple times
   - Accept or reject auditions
   - Track quality metrics

3. **Manage Team**
   - Invite team members (Recruiters)
   - Assign roles (Owner, Recruiter, Viewer)
   - Manage permissions

4. **Messaging**
   - Message selected actors
   - Schedule auditions/meetings
   - Share feedback

5. **Dashboard Analytics**
   - View submission statistics
   - Track application progress
   - Monitor team activity

### What Producers Cannot Do

- Upload personal videos (Actors only)
- Apply for casting calls (Actors only)
- Create secondary production teams (need to use ProductionTeam model)
- Access other producers' casting calls

---

## 📊 Producer Data Flow

```
┌─────────────────────────────────────────────────────┐
│     Producer Registration                            │
│                                                      │
│  1. Enter company details                           │
│  2. Set password                                    │
│  3. Receive OTP via email                           │
│  4. Verify OTP                                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├─> Create PendingUser (5 min TTL)
                   │
                   ├─> Verify Email
                   │
                   └─> Create User (role: Producer)
                          │
                          ├─ Generate JWT
                          │
                          └─ Redirect to Dashboard
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
                   ▼               ▼               ▼
            Create Casting    Manage Team    Review Apps
             Calls (Casting)  (ProductionTeam) (Videos)
                   │               │               │
                   ├──────────────┬┴───────────────┤
                   │              │                │
                   └──> Producer Dashboard <──────┘
                          (Statistics, Submissions)
```

---

## 🔄 Login Flow for Producers

### Step 1: Frontend Submission
```javascript
const loginData = {
  email: "john@productionhouse.com",
  password: "securePassword123"
};

// POST /api/v1/auth/login
```

### Step 2: Backend Processing
```javascript
// 1. Find user in User collection
let user = await User.findOne({ email }).select('+password');

// 2. If not found, check legacy ProductionHouse (backward compatibility)
if (!user) {
  user = await ProductionHouse.findOne({ email }).select('+password');
  isProductionHouse = true;
}

// 3. Compare passwords
const isMatch = await user.matchPassword(password);

// 4. Generate JWT
const token = user.getSignedJwtToken();
```

### Step 3: Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@productionhouse.com",
    "companyName": "ABC Productions",
    "role": "Producer",
    "phone": "9876543210",
    "location": "Los Angeles, CA",
    "website": "https://abcproductions.com",
    "profileImage": "https://res.cloudinary.com/...",
    "isVerified": true
  }
}
```

### Step 4: Frontend Storage
```javascript
// Store in localStorage
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Dispatch event to notify header
window.dispatchEvent(new Event('authChange'));

// Redirect to producer dashboard
navigate('/dashboard/producer');
```

---

## 🎯 Producer Dashboard (`pages/ProducerDashboard.jsx`)

### Main Features

1. **Welcome Section**
   ```
   Welcome back, [Company Name]
   Dashboard statistics and quick actions
   ```

2. **Key Metrics**
   - Total casting calls created
   - Total applications received
   - Shortlisted candidates
   - Team members

3. **Recent Castings**
   - List of casting calls
   - Status (Active/Closed)
   - Application count
   - Quick access to submissions

4. **Applications Tab**
   - View all submissions
   - Filter by status (Pending/Accepted/Rejected)
   - Review videos
   - Accept/Reject actions

5. **Team Management**
   - Add team members
   - Assign roles
   - Manage permissions

6. **Messages**
   - Direct messaging with actors
   - Scheduling interface

---

## 🔗 Related API Endpoints

### Casting Calls (Producer)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/casting` | GET | Get producer's casting calls |
| `/api/v1/casting` | POST | Create new casting call |
| `/api/v1/casting/:id` | GET | Get casting call details |
| `/api/v1/casting/:id` | PUT | Update casting call |
| `/api/v1/casting/:id` | DELETE | Close casting call |

### Submissions (Producer)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/casting/:id/videos` | GET | View submissions for casting |
| `/api/v1/videos/:id/status` | PATCH | Accept/Reject submission |
| `/api/v1/videos/:id/metrics` | PUT | Update quality metrics |

### Team Management
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/teams` | GET | Get producer's teams |
| `/api/v1/teams` | POST | Create new team |
| `/api/v1/teams/:id/members` | POST | Add team member |
| `/api/v1/teams/:id/members/:memberId` | DELETE | Remove team member |

### Messaging
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/messages` | GET | Get conversations |
| `/api/v1/messages/:userId` | POST | Send message |

---

## 📱 User Display Handling

### Display Names Based on Role

```javascript
// Actor
displayName = user.name; // "John Actor"

// Producer/ProductionTeam
displayName = user.companyName; // "ABC Productions"

// Implementation
const displayName = (user?.role === 'Producer' || user?.role === 'ProductionTeam') 
  ? user?.companyName 
  : user?.name;
```

---

## 🔄 Legacy vs Modern System

### Legacy (ProductionHouse Collection)
- Separate collection for production users
- Limited to role: 'ProductionTeam' only
- Separate authentication logic
- Auto-deleted TTL not on temp table

### Modern (User Collection)
- Unified collection for all user types
- role: 'Producer' or 'ProductionTeam'
- Unified authentication logic
- PendingUser for temp storage
- More flexible and scalable

### Backward Compatibility
```javascript
// In auth.js login
let user = await User.findOne({ email });
if (!user) {
  // Check legacy ProductionHouse
  user = await ProductionHouse.findOne({ email });
}
```

---

## 🚀 Key Takeaways

1. **Unified User Model** - Producers are Users with role: 'Producer' or 'ProductionTeam'
2. **Email Verification** - OTP-based verification required before account activation
3. **Password Management** - 6+ character requirement, bcrypt hashing
4. **Team Support** - ProductionTeam model allows multi-member teams
5. **Backward Compatibility** - Legacy ProductionHouse still supported
6. **Dashboard Access** - `/dashboard/producer` shows casting calls and submissions
7. **Role-Based Access** - authorize middleware restricts endpoints by role
8. **Display Names** - Company names shown instead of personal names for producers
9. **Messaging** - Direct communication with actors
10. **Analytics** - Track submissions, shortlists, and application metrics

---

## 📋 Summary Table

| Aspect | Details |
|--------|---------|
| **Model** | User collection with role: 'Producer' or ProductionTeam collection |
| **Registration** | POST /auth/register with companyName, phone, location |
| **Email Verification** | OTP-based, 10-minute expiry |
| **Authentication** | JWT-based with 30-day expiry |
| **Dashboard** | `/dashboard/producer` |
| **Team Management** | ProductionTeam model with Owner/Recruiter/Viewer roles |
| **Casting Creation** | Create casting calls with role requirements |
| **Submissions** | Review actor audition videos with quality metrics |
| **Messaging** | Direct communication with selected actors |
| **Backward Compat** | ProductionHouse collection still supported |
| **Access Control** | authorize('Producer', 'ProductionTeam') middleware |
| **Display Name** | companyName (not personal name) |

