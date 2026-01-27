# Actory Casting & Application Submission System - Complete Guide

## Overview
The Actory casting system is a comprehensive platform that enables:
- **Production Houses/Recruiters**: Create and manage casting calls, track submissions
- **Actors**: Apply to casting calls, submit audition videos
- **Production Teams**: Collaborate on managing castings and evaluating submissions

---

## 1. CASTING CALLS SYSTEM

### Data Model: CastingCall

**File**: [models/CastingCall.js](models/CastingCall.js)

#### Key Fields
```javascript
{
  roleTitle: String,              // e.g., "Lead Actor", "Supporting Actress"
  description: String,            // Role description (max 500 chars)
  
  // Physical & Demographic Requirements
  ageRange: {
    min: Number,                  // Minimum age (1-120)
    max: Number                   // Maximum age (must be >= min)
  },
  genderRequirement: String,      // 'male' | 'female' | 'any' | 'other'
  heightRange: {
    min: Number,                  // Optional, in cm
    max: Number
  },
  experienceLevel: String,        // 'beginner' | 'intermediate' | 'professional'
  
  // Project Details
  location: String,               // Shooting location
  numberOfOpenings: Number,       // How many actors needed for this role
  skills: [String],               // Required skills (e.g., ["Dancing", "Singing"])
  
  // Timeline Management
  submissionDeadline: Date,       // When actors must submit by
  auditionDate: Date,             // When auditions take place
  shootStartDate: Date,           // When shooting begins
  shootEndDate: Date,             // When shooting ends
  
  // Relationships
  producer: ObjectId,             // User who created the casting (ref: User)
  project: ObjectId,              // Associated FilmProject (optional)
  team: ObjectId,                 // Associated ProductionTeam (optional)
  
  // Metadata
  createdAt: Date,                // When casting was created
}
```

#### Important Validations
- **Date Ordering**: `submissionDeadline < auditionDate < shootStartDate < shootEndDate`
- **Future Dates**: All dates must be in the future at creation time
- **Minimum Requirements**: All fields except `project` and `projectRole` are required
- **TTL Index**: Casting calls auto-delete after `shootEndDate` passes

---

## 2. CASTING CALL MANAGEMENT

### Routes & Endpoints

#### Get All Available Castings (Public)
```
GET /api/v1/casting
Access: Public
```
**Functionality**:
- Returns all active castings (not expired, not archived)
- Automatically filters out castings whose projects are archived
- Sortable by submission deadline
- Query parameters for filtering:
  - `producer`: Filter by specific producer
  - `experienceLevel`: beginner/intermediate/professional
  - `genderRequirement`: male/female/any/other
  - `location`: Search by location (case-insensitive)

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "casting123",
      "roleTitle": "Lead Actor",
      "description": "...",
      "ageRange": { "min": 18, "max": 35 },
      "submissionDeadline": "2026-02-10T00:00:00.000Z",
      "producer": { "name": "John Doe", "email": "john@example.com" },
      "project": { "name": "My Film", "description": "..." }
    }
  ]
}
```

#### Get Producer's Castings
```
GET /api/v1/casting/producer
Access: Private (Producer, ProductionTeam)
```
- Returns ALL casting calls created by logged-in producer
- Includes both active and expired castings
- Useful for producer dashboard to manage all their castings
- Sorted by creation date (newest first)

#### Get Team's Castings
```
GET /api/v1/casting/team/:teamId
Access: Private (Team members only)
```
- Returns all castings for projects belonging to a production team
- Authorization: User must be team owner or team member
- Allows team members to see all castings they're responsible for

#### Get Single Casting
```
GET /api/v1/casting/:id
Access: Public
```
- Returns detailed information about a specific casting call

#### Create Casting Call
```
POST /api/v1/casting
Access: Private (Producer, ProductionTeam)
Request Body:
{
  "roleTitle": "Lead Actor",
  "description": "Looking for...",
  "ageRange": { "min": 18, "max": 40 },
  "genderRequirement": "male",
  "experienceLevel": "professional",
  "location": "Mumbai",
  "numberOfOpenings": 2,
  "skills": ["Acting", "Hindi Speaking"],
  "auditionDate": "2026-02-15T10:00:00Z",
  "submissionDeadline": "2026-02-10T23:59:59Z",
  "shootStartDate": "2026-02-20T00:00:00Z",
  "shootEndDate": "2026-03-20T00:00:00Z"
}
```

#### Update Casting Call
```
PUT /api/v1/casting/:id
Access: Private (Producer only - must be creator)
```
- **Restriction**: Cannot update if submission deadline has passed
- Updates date fields automatically convert to Date objects
- Validates date ordering before saving

#### Delete Casting Call
```
DELETE /api/v1/casting/:id
Access: Private (Producer only - must be creator)
```
- **Restriction**: Cannot delete if submission deadline has passed
- Prevents accidental deletion of closed castings

---

## 3. VIDEO SUBMISSION SYSTEM

### Data Model: Video

**File**: [models/Video.js](models/Video.js)

#### Key Fields
```javascript
{
  // Basic Info
  title: String,                  // Video title/description
  videoUrl: String,               // URL to video (Cloudinary)
  cloudinaryId: String,           // Cloudinary public ID for deletion
  type: String,                   // 'profile' | 'audition'
  
  // For AUDITION Videos (Required)
  castingCall: ObjectId,          // ref: CastingCall
  portfolioUrl: String,           // PDF portfolio URL (required for audition)
  
  // Actor Physical Attributes (Audition only)
  height: Number,                 // in cm (50-300)
  weight: Number,                 // in kg (10-500)
  age: Number,                    // 1-120
  skills: [String],               // e.g., ["Acting", "Hindi"]
  
  // Contact & Location Info
  permanentAddress: String,
  livingCity: String,
  dateOfBirth: Date,
  phoneNumber: String,
  email: String,
  
  // Audition Metadata
  qualityAssessment: {
    level: String,                // Quality level
    score: Number,                // Quality score
    details: Object               // Detailed assessment
  },
  
  // Status Tracking
  status: String,                 // 'Pending' | 'Accepted' | 'Rejected'
  
  // Engagement Metrics
  views: Number,                  // Default: 0
  
  // Actor Info
  actor: ObjectId,                // ref: User (who submitted)
  
  createdAt: Date                 // When submitted
}
```

---

## 4. APPLICATION & SUBMISSION FLOW

### For Actors: How to Apply to Castings

#### Step 1: Browse Available Castings
```
GET /api/v1/casting (Public)
```
Actors can search for castings filtered by:
- Experience level
- Gender requirement
- Location
- Other demographics

#### Step 2: Submit Audition Video
```
POST /api/v1/casting/:castingCallId/videos
Access: Private (Actor only)

Request Body:
{
  "title": "My Audition for Lead Actor",
  "videoUrl": "https://...",      // From Cloudinary upload
  "cloudinaryId": "xyz...",
  "portfolioUrl": "https://...pdf",
  "height": 180,
  "weight": 75,
  "age": 28,
  "skills": ["Acting", "Dancing"],
  "permanentAddress": "123 Main St",
  "livingCity": "Mumbai",
  "dateOfBirth": "1996-05-10",
  "phoneNumber": "+919876543210",
  "email": "actor@example.com",
  "videoHeight": 720,              // For quality assessment
  "duration": 45,                  // Video duration in seconds
  "brightness": 0.85,
  "audioQuality": 0.9
}
```

**What Happens**:
1. Video submission is validated against casting requirements
2. Quality assessment is calculated based on:
   - Video metadata (resolution, brightness, audio quality)
   - Actor's previous shortlist history
   - Video duration
3. Video stored in Cloudinary
4. Submission status set to "Pending"

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "video123",
    "title": "My Audition...",
    "actor": "actor_id",
    "castingCall": "casting_id",
    "status": "Pending",
    "qualityAssessment": {
      "level": "High",
      "score": 8.5
    },
    "createdAt": "2026-01-27T10:30:00Z"
  }
}
```

#### Step 3: Track Your Submissions
```
GET /api/v1/videos/mine
Access: Private (Actor)
```
Actors can see:
- All their audition submissions
- Status of each submission (Pending/Accepted/Rejected)
- Associated casting call details
- Submission timestamps

---

## 5. RECRUITER/PRODUCER ACTIVE CASTINGS & SUBMISSION TRACKING

### For Recruiters/Production Houses: Manage Castings & Track Submissions

#### Dashboard: View Your Active Castings
```
GET /api/v1/casting/producer
Access: Private (Producer, ProductionTeam)
```

**Returns**:
- All casting calls created by the producer
- Organized by creation date (newest first)
- Includes project and producer information

**Use Case**: Producer dashboard shows all castings they've created so they can quickly navigate to specific castings.

#### Track Submissions for a Casting
```
GET /api/v1/casting/:castingCallId/videos
Access: Private (Producer or Team Members)
```

**What You Get**:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "video123",
      "title": "Audition Submission",
      "actor": {
        "_id": "actor_id",
        "name": "Raj Kumar",
        "email": "raj@example.com",
        "gender": "male"
      },
      "height": 180,
      "weight": 75,
      "age": 28,
      "skills": ["Acting", "Dancing"],
      "status": "Pending",
      "views": 1,
      "createdAt": "2026-01-27T10:30:00Z",
      "qualityAssessment": {
        "level": "High",
        "score": 8.5
      },
      "permanentAddress": "123 Main St",
      "livingCity": "Mumbai",
      "phoneNumber": "+919876543210",
      "email": "raj@example.com",
      "portfolioUrl": "https://...pdf"
    },
    // ... more submissions
  ]
}
```

### Submission Review & Decision Process

#### View a Single Submission
```
GET /api/v1/casting/:castingCallId/videos/:videoId
```
Allows recruiters to view detailed information about a specific submission.

#### Update Submission Status
```
PATCH /api/v1/videos/:videoId/status
Access: Private (Producer, ProductionTeam - non-Viewer members)

Request Body:
{
  "status": "Accepted"  // or "Rejected" or "Pending"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "video123",
    "status": "Accepted",
    "actor": "actor_id",
    "createdAt": "2026-01-27T10:30:00Z"
  }
}
```

**Authorization Rules**:
- Producer can always update their own castings
- Team members can update ONLY if their role is NOT "Viewer"
- Team owner can always update

#### Update Submission Metrics
```
PUT /api/v1/videos/:videoId/metrics
Access: Private (Producer, ProductionTeam)

Request Body:
{
  "videoHeight": 1080,
  "brightness": 0.88,
  "audioQuality": 0.92,
  "duration": 50
}
```
Allows updating quality assessment based on actual viewing and evaluation.

---

## 6. SUBMISSION TRACKING DATA & ANALYTICS

### Submission Status States
- **Pending**: Initial state when submitted
- **Accepted**: Shortlisted/selected for next round
- **Rejected**: Not selected

### Quality Assessment
Each submission includes a quality assessment with:
- **Level**: Qualitative rating (e.g., "High", "Medium", "Low")
- **Score**: Numerical score (0-10)
- **Details**: Detailed assessment object

**Calculated Based On**:
```
- Video technical quality (resolution, brightness, audio)
- Actor's previous shortlist history
- Video duration and engagement
- Producer's watch time on video
```

### Key Metrics Available
- **Submission Count**: Total videos received for a casting
- **Acceptance Rate**: Ratio of accepted to total submissions
- **Status Distribution**: Pending/Accepted/Rejected breakdown
- **Quality Score Distribution**: Spread of quality scores
- **View Count**: How many times each submission was watched

---

## 7. TEAM COLLABORATION IN CASTING

### Production Team Structure
```
ProductionTeam {
  owner: UserId,                  // Team owner (Creator)
  members: [
    {
      user: UserId,
      role: "Manager" | "Recruiter" | "Viewer"
    }
  ]
}
```

### Role-Based Access for Submissions
- **Owner**: Full access to review, accept/reject submissions
- **Recruiter** (non-Viewer): Can view and update submission status
- **Viewer**: Read-only access to submissions

### Team-Based Castings
```
GET /api/v1/casting/team/:teamId
```
- Shows all castings for team's projects
- All team members can view submissions
- Only authorized members (Owner/Recruiter) can update status

---

## 8. SUBMISSION EVALUATION WORKFLOW

### For Recruiters Reviewing Submissions

#### Workflow Steps:
1. **Access Active Castings Dashboard**
   ```
   GET /api/v1/casting/producer
   ```
   See all castings and their status

2. **View Submissions for Specific Casting**
   ```
   GET /api/v1/casting/:castingCallId/videos
   ```
   See all submissions with:
   - Actor details (name, age, height, location)
   - Quality assessment score
   - Submission timestamp
   - Current status

3. **Review Individual Submission**
   - Watch video at: `videoUrl`
   - Review portfolio at: `portfolioUrl` (PDF)
   - Check actor's contact info
   - View skill match against requirements

4. **Make Decision**
   ```
   PATCH /api/v1/videos/:videoId/status
   Body: { "status": "Accepted" or "Rejected" }
   ```

5. **Track Status**
   - Pending: Actor still in consideration
   - Accepted: Actor shortlisted
   - Rejected: Actor not selected

### Submission Data Available for Analysis

**Per Submission**:
- Actor name, age, gender, contact info
- Physical attributes (height, weight)
- Skills and experience
- Quality assessment (score & level)
- Submission date/time
- View count
- Current status

**Per Casting**:
- Total submissions received
- Submissions by status (Pending/Accepted/Rejected)
- Quality score statistics
- Submissions over time

---

## 9. API ENDPOINT SUMMARY

### Casting Management
| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/v1/casting` | GET | Public | Browse all active castings |
| `/api/v1/casting` | POST | Private (Producer) | Create new casting |
| `/api/v1/casting/:id` | GET | Public | View casting details |
| `/api/v1/casting/:id` | PUT | Private (Producer) | Update casting |
| `/api/v1/casting/:id` | DELETE | Private (Producer) | Delete casting |
| `/api/v1/casting/producer` | GET | Private (Producer) | Get producer's castings |
| `/api/v1/casting/team/:teamId` | GET | Private (Team member) | Get team's castings |

### Submission Management
| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/v1/casting/:castingCallId/videos` | GET | Private (Producer/Team) | View all submissions |
| `/api/v1/casting/:castingCallId/videos` | POST | Private (Actor) | Submit audition video |
| `/api/v1/videos/mine` | GET | Private (Actor) | View my submissions |
| `/api/v1/videos/:id/status` | PATCH | Private (Producer/Team) | Update submission status |
| `/api/v1/videos/:id/metrics` | PUT | Private (Producer/Team) | Update quality metrics |

---

## 10. KEY FEATURES & BUSINESS LOGIC

### Automatic Filtering
- **Active Castings Only**: Public casting list automatically excludes:
  - Castings past submission deadline
  - Castings from archived projects
  - Expired auditions

### Date Validations
- All casting dates must satisfy: `submission < audition < shootStart < shootEnd`
- No dates can be in the past
- Enforced at both schema and pre-save hook levels

### Quality Assessment
- Automatically calculated when actor submits
- Based on video technical quality
- Considers actor's previous shortlist success rate
- Updated when producer reviews metrics

### Submission Restrictions
- Actors can only submit AFTER casting is created
- Submissions accepted UNTIL submission deadline
- Cannot accept/reject submissions if deadline passed

### Team Authorization
- Producer can view/edit all their castings
- Team members can view team castings (if authorized)
- Only non-Viewer members can change submission status
- Owner always has full access

---

## 11. DATA RELATIONSHIPS

```
FilmProject
  ├── team: ProductionTeam
  └── castings: CastingCall[]

CastingCall
  ├── producer: User (Creator)
  ├── project: FilmProject (Optional)
  ├── team: ProductionTeam (Optional)
  └── submissions: Video[]

Video (Audition)
  ├── actor: User (Actor who submitted)
  ├── castingCall: CastingCall (Applied to)
  └── status: Pending|Accepted|Rejected

User
  ├── castings: CastingCall[] (if Producer)
  ├── submissions: Video[] (if Actor)
  └── teams: ProductionTeam[] (if Team member)

ProductionTeam
  ├── owner: User
  ├── members: Member[]
  └── projects: FilmProject[]
```

---

## 12. COMMON USE CASES

### Use Case 1: Producer Creates Casting
```
1. POST /api/v1/casting
   - Define role requirements
   - Set timeline (submission, audition, shoot dates)
   - Specify physical requirements and skills
   
2. Casting goes live - visible to all actors
```

### Use Case 2: Actor Applies to Casting
```
1. GET /api/v1/casting
   - Find interesting castings
   
2. POST /api/v1/casting/:castingCallId/videos
   - Submit audition video
   - Provide contact information
   - Include portfolio PDF
   
3. GET /api/v1/videos/mine
   - Track submission status
```

### Use Case 3: Recruiter Reviews Submissions
```
1. GET /api/v1/casting/producer
   - View all active castings
   
2. GET /api/v1/casting/:castingCallId/videos
   - See all submissions for casting
   - View quality scores
   - Check actor details
   
3. PATCH /api/v1/videos/:videoId/status
   - Accept promising candidates
   - Reject unsuitable candidates
   - Keep promising ones as Pending for later
```

### Use Case 4: Team Collaboration
```
1. Team owner creates casting (via project or directly)
2. Team members (with Recruiter role) view submissions
3. Team discusses and collaborates on decisions
4. Recruiter updates submission status
5. All team members can track progress
```

---

## 13. IMPORTANT NOTES

### Submission Workflow Considerations
- Videos must include portfolio PDF for audition submissions
- Quality assessment is calculated automatically
- Recruiters can update quality metrics based on their review
- Status changes are tracked with submission data

### Performance Considerations
- Castings auto-expire after shootEndDate
- TTL index automatically removes old castings
- Pagination recommended for large submission lists
- Quality scores help prioritize reviews

### Data Privacy
- Portfolio PDFs stored with authentication
- Actor contact info visible only to authorized recruiters
- Personal data (DOB, address) encrypted at storage

---

## 14. FUTURE ENHANCEMENT OPPORTUNITIES

1. **Batch Status Updates**: Update multiple submissions at once
2. **Advanced Filtering**: Filter submissions by quality score, skills match
3. **Submission Analytics**: Dashboard showing acceptance rates, demographics
4. **Notifications**: Auto-notify actors of status changes
5. **Interview Scheduling**: Schedule interviews for accepted submissions
6. **Comments/Feedback**: Recruiters leave notes on submissions
7. **Submission Ranking**: Automatically rank submissions by quality/fit
8. **Bulk Operations**: Bulk accept/reject for mass decisions

---

**Created**: January 27, 2026  
**Version**: 1.0 - Complete System Documentation
