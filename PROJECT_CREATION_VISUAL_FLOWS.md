# Project & Team Collaboration - Visual Flows

## 1. Complete User Journey: From Team Creation to Casting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION HOUSE JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 1: USER SIGNUP & AUTHENTICATION ─────────────┐
│                                                      │
│  Producer/ProductionHouse Registration              │
│  └─→ Email & Password                               │
│  └─→ Role: "Producer" or "ProductionTeam"           │
│  └─→ Login & Dashboard Access                       │
│                                                      │
└──────────────────────────────────────────────────────┘
                        ↓

┌─ STEP 2: CREATE PRODUCTION TEAM ──────────────────┐
│                                                    │
│  POST /api/v1/teams                                │
│  {                                                 │
│    name: "Monsoon Productions",                    │
│    productionHouse: "XYZ Productions",             │
│    description: "Our core creative team"           │
│  }                                                 │
│                                                    │
│  ✓ Team Created                                    │
│  ✓ User becomes Team Owner                         │
│  ✓ User auto-added as Owner member                 │
│                                                    │
└──────────────────────────────────────────────────────┘
                        ↓

┌─ STEP 3: INVITE TEAM MEMBERS ─────────────────────┐
│                                                    │
│  POST /api/v1/teamInvitations                       │
│  {                                                 │
│    teamId: "team_123",                             │
│    inviteeEmail: "recruiter@example.com",          │
│    role: "Recruiter" // or "Viewer"                │
│  }                                                 │
│                                                    │
│  ✓ Invitation Created (48hr expiration)            │
│  ✓ Email Notification Sent                         │
│  ✓ Invitation Token Generated                      │
│                                                    │
└──────────────────────────────────────────────────────┘
                        ↓
                    (Recruiter gets email)
                        ↓

┌─ STEP 3B: RECRUITER ACCEPTS INVITATION ───────────┐
│                                                    │
│  POST /api/v1/teamInvitations/accept                │
│  {                                                 │
│    invitationId: "inv_456"                         │
│  }                                                 │
│                                                    │
│  ✓ Invitation Status → "accepted"                  │
│  ✓ Recruiter Added to Team Members                 │
│  ✓ Recruiter Gets Role: "Recruiter"               │
│  ✓ Owner Notified of Acceptance                    │
│  ✓ Recruiter Now Has Team Access                   │
│                                                    │
└──────────────────────────────────────────────────────┘
                        ↓

┌─ STEP 4: CREATE FILM PROJECT ────────────────────┐
│                                                  │
│  POST /api/v1/projects                           │
│  {                                               │
│    teamId: "team_123",                           │
│    name: "Monsoon Action Drama",                 │
│    genre: "Action/Drama",                        │
│    language: "English",                          │
│    location: "Goa",                              │
│    startDate: "2024-06-01",                      │
│    endDate: "2024-08-15",                        │
│    description: "...",                           │
│    roles: [                                      │
│      {                                           │
│        roleName: "Lead Hero",                    │
│        roleType: "Lead",                         │
│        ageMin: 28, ageMax: 38,                   │
│        gender: "Male",                           │
│        skillsRequired: ["Acting", "Martial Arts"], │
│        experienceLevel: "Professional",          │
│        numberOfOpenings: 1                       │
│      },                                          │
│      {                                           │
│        roleName: "Lead Heroine",                 │
│        roleType: "Lead",                         │
│        ageMin: 25, ageMax: 35,                   │
│        gender: "Female",                         │
│        skillsRequired: ["Acting"],               │
│        experienceLevel: "Intermediate",          │
│        numberOfOpenings: 1                       │
│      }                                           │
│    ]                                             │
│  }                                               │
│                                                  │
│  ✓ Project Created (Status: "draft")             │
│  ✓ 2 Roles Added                                 │
│  ✓ Creator Becomes Collaborator                  │
│  ✓ Project Linked to Team                        │
│  ✓ All Team Members Notified                     │
│                                                  │
└──────────────────────────────────────────────────────┘
                        ↓
            (Background: Auto-Generation)
                        ↓

┌─ STEP 4B: SYSTEM AUTO-GENERATES CASTING CALLS ──┐
│                                                  │
│  For Each Role:                                  │
│  • CastingCall Created                           │
│  • Inherits role details (title, age, gender...) │
│  • Dates calculated from project dates           │
│  • Status set to "open"                          │
│                                                  │
│  Casting 1: "Lead Hero"                          │
│  • roleTitle: "Lead Hero"                        │
│  • ageRange: 28-38, gender: Male                 │
│  • submissionDeadline: 2024-05-25                │
│  • auditionDate: 2024-05-29                      │
│  • shootStartDate: 2024-06-01                    │
│  • shootEndDate: 2024-08-15                      │
│  • status: "open"                                │
│                                                  │
│  Casting 2: "Lead Heroine"                       │
│  • roleTitle: "Lead Heroine"                     │
│  • ageRange: 25-35, gender: Female               │
│  • [Same date details as above]                  │
│  • status: "open"                                │
│                                                  │
│  ✓ Both Castings Now Visible on Public Page      │
│  ✓ Actors Can Discover & Apply                   │
│                                                  │
└──────────────────────────────────────────────────────┘
                        ↓
              (Public Actors Access)
                        ↓

┌─ STEP 5: ACTORS BROWSE CASTINGS ─────────────────┐
│                                                   │
│  GET /api/v1/casting?gender=Male&age=28-38       │
│                                                   │
│  ✓ Returns all active castings                    │
│  ✓ Can filter by: experience, gender, location   │
│  ✓ Shows: role title, requirements, dates        │
│                                                   │
│  Actors See:                                      │
│  ┌─────────────────────────────────────────┐      │
│  │ Lead Hero - Monsoon Action Drama        │      │
│  │ Age: 28-38, Gender: Male                │      │
│  │ Experience: Professional                │      │
│  │ Skills: Acting, Martial Arts            │      │
│  │ Location: Goa                           │      │
│  │ Submission Deadline: 2024-05-25         │      │
│  │ [APPLY BUTTON]                          │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
└────────────────────────────────────────────────────┘
                        ↓

┌─ STEP 6: ACTOR APPLIES TO CASTING ────────────────┐
│                                                   │
│  POST /api/v1/casting/:castingId/apply             │
│  {                                                │
│    videoId: "vid_123",                           │
│    coverLetter: "I'm very interested..."         │
│  }                                                │
│                                                   │
│  ✓ Application Created                            │
│  ✓ Status: "pending"                              │
│  ✓ Team Notified of New Application               │
│                                                   │
└────────────────────────────────────────────────────┘
                        ↓
              (Back to Team)
                        ↓

┌─ STEP 7: TEAM REVIEWS APPLICATIONS ────────────────┐
│                                                    │
│  GET /api/v1/dashboard/applications                │
│  (For Producer/Team Members)                      │
│                                                    │
│  Shows All Applications for Team's Castings:      │
│  ┌──────────────────────────────────────────┐     │
│  │ Casting: Lead Hero                       │     │
│  │ Applicants: 15                           │     │
│  │ ├─ John Doe (Professional, 31 years)    │     │
│  │ │  Video: [WATCH] Cover: [VIEW]          │     │
│  │ │  Actions: [SHORTLIST] [REJECT] [CALL]  │     │
│  │ │                                         │     │
│  │ ├─ Jane Smith (Professional, 30 years)  │     │
│  │ │  ...                                    │     │
│  │ │                                         │     │
│  │ └─ [+ 13 more]                           │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  Team Can:                                        │
│  • Shortlist candidates                           │
│  • Reject candidates                              │
│  • Request auditions                              │
│  • Leave comments                                 │
│                                                   │
└─────────────────────────────────────────────────────┘
```

---

## 2. Team Member Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│              TEAM STRUCTURE VISUALIZATION                     │
└─────────────────────────────────────────────────────────────┘

ProductionTeam: "Monsoon Productions"
│
├─── Owner: User123 (Producer)
│    ├─ Can: Create projects
│    ├─ Can: Add/manage roles
│    ├─ Can: Create casting calls
│    ├─ Can: Invite team members
│    ├─ Can: Remove members
│    ├─ Can: Update team info
│    └─ Can: Delete team & projects
│
├─── Members:
│    │
│    ├─ User456 (Role: "Recruiter")
│    │  ├─ Can: Create projects
│    │  ├─ Can: Add/manage roles
│    │  ├─ Can: Create casting calls
│    │  ├─ Can: Review applications
│    │  ├─ Cannot: Invite members
│    │  ├─ Cannot: Remove members
│    │  ├─ Cannot: Update team info
│    │  └─ Can: Leave team
│    │
│    └─ User789 (Role: "Viewer")
│       ├─ Can: View projects
│       ├─ Can: View casting calls
│       ├─ Can: View applications
│       ├─ Cannot: Create projects
│       ├─ Cannot: Add roles
│       ├─ Cannot: Create castings
│       ├─ Cannot: Invite members
│       └─ Can: Leave team
│
└─── Related Resources:
     │
     ├─ FilmProject: "Monsoon Action Drama"
     │  ├─ Status: "draft"
     │  ├─ Roles: 2 (Lead Hero, Lead Heroine)
     │  ├─ CreatedBy: User456 (Recruiter)
     │  ├─ Collaborators: [User123, User456]
     │  └─ CastingCalls: 2 (auto-generated)
     │
     ├─ FilmProject: "Winter Romance"
     │  ├─ Status: "active"
     │  ├─ Roles: 3
     │  └─ CastingCalls: 3
     │
     └─ FilmProject: "Spring Drama"
        ├─ Status: "archived"
        └─ CastingCalls: [archived]
```

---

## 3. Data Flow: Project to Casting

```
┌────────────────────────────────────────────────────────────┐
│              ROLE → CASTING FLOW                            │
└────────────────────────────────────────────────────────────┘

INPUT: Role Definition (in Project)
│
├─ roleName: "Lead Hero"
├─ roleType: "Lead"
├─ ageMin: 28, ageMax: 38
├─ gender: "Male"
├─ physicalTraits: "Athletic, 6ft+"
├─ skillsRequired: ["Acting", "Martial Arts", "Horse Riding"]
├─ experienceLevel: "Professional"
├─ roleDescription: "The protagonist of our story"
├─ numberOfOpenings: 1
│
└─ [Auto-generated in background]
   │
   ↓
   
OUTPUT: Casting Call
│
├─ roleTitle: "Lead Hero" ✓
├─ description: "The protagonist of our story" ✓
├─ ageRange: { min: 28, max: 38 } ✓
├─ genderRequirement: "male" ✓
├─ experienceLevel: "professional" ✓
├─ skillsRequired: ["Acting", "Martial Arts", "Horse Riding"] ✓
├─ numberOfOpenings: 1 ✓
├─ location: [from project.location] ✓
├─ submissionDeadline: [NOW + 7 days] ✓
├─ auditionDate: [NOW + 14 days] ✓
├─ shootStartDate: [from project.startDate] ✓
├─ shootEndDate: [from project.endDate] ✓
├─ status: "open"
├─ project: [link to project]
├─ team: [link to team]
└─ producer: [link to creator]
```

---

## 4. State Machine: Project Status

```
┌────────────────────────────────────────────────────────────┐
│           PROJECT STATUS STATE MACHINE                      │
└────────────────────────────────────────────────────────────┘

           ┌─────────────────────────────┐
           │      DRAFT STATUS           │
           │                             │
           │ • Roles can be added/edited │
           │ • Not visible to public     │
           │ • Castings not public       │
           │ • No applications yet       │
           └──────────────┬──────────────┘
                          │
                     [Publish]
                          │
                          ↓
           ┌─────────────────────────────┐
           │      ACTIVE STATUS          │
           │                             │
           │ • Roles finalized           │
           │ • Visible to actors         │
           │ • Casting calls live        │
           │ • Accepting applications    │
           │ • Recruitment happening     │
           └──────────────┬──────────────┘
                          │
                  [Complete/Cancel]
                          │
                          ↓
           ┌─────────────────────────────┐
           │     ARCHIVED STATUS         │
           │                             │
           │ • Project completed         │
           │ • No longer accepting apps  │
           │ • Not visible to public     │
           │ • Data retained for records │
           │ • Read-only access          │
           └─────────────────────────────┘
```

---

## 5. Invitation State Flow

```
┌────────────────────────────────────────────────────────────┐
│        TEAM INVITATION STATE MACHINE                        │
└────────────────────────────────────────────────────────────┘

Owner Creates Invitation
│
├─ invitedBy: Owner
├─ invitee: Target User
├─ role: "Recruiter" or "Viewer"
├─ token: [unique token]
├─ expiresAt: NOW + 48 hours
│
↓

           ┌────────────────────┐
           │   PENDING STATUS   │
           │                    │
           │ Invitation Valid   │
           │ Waiting for Action │
           └─────────┬──────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    [Accept]    [Reject]    [48hr Pass]
         │           │           │
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ACCEPTED│  │REJECTED│  │EXPIRED │
    │        │  │        │  │        │
    │User    │  │User    │  │Invalid │
    │Added   │  │Not     │  │Token   │
    │to Team │  │Added   │  │        │
    └────────┘  └────────┘  └────────┘
         │           │           │
         ↓           ↓           ↓
    Notification  Notification  Auto-Expire
    Sent to       Sent to       Owner
    Owner         Owner         Notified
```

---

## 6. Authorization Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION MATRIX                             │
├──────────────────────────────────────────────────────────────────┤
│ Operation                │ Owner │ Recruiter │ Viewer │ Public │
├──────────────────────────┼───────┼───────────┼────────┼────────┤
│ CREATE TEAM              │  ✅   │    -      │   -    │   -    │
│ VIEW TEAM DETAILS        │  ✅   │    ✅     │  ✅    │   -    │
│ UPDATE TEAM INFO         │  ✅   │    -      │   -    │   -    │
│ DELETE TEAM              │  ✅   │    -      │   -    │   -    │
│ INVITE MEMBERS           │  ✅   │    -      │   -    │   -    │
│ REMOVE MEMBERS           │  ✅   │    -      │   -    │   -    │
│ LEAVE TEAM               │  ✅   │    ✅     │  ✅    │   -    │
│                          │       │           │        │        │
│ CREATE PROJECT           │  ✅   │    ✅     │   -    │   -    │
│ VIEW PROJECT             │  ✅   │    ✅     │  ✅    │  ✅*   │
│ UPDATE PROJECT           │  ✅   │    ✅     │   -    │   -    │
│ DELETE PROJECT           │  ✅   │    ✅     │   -    │   -    │
│ ADD ROLE                 │  ✅   │    ✅     │   -    │   -    │
│ EDIT ROLE                │  ✅   │    ✅     │   -    │   -    │
│                          │       │           │        │        │
│ CREATE CASTING CALL      │  ✅   │    ✅     │   -    │   -    │
│ VIEW TEAM CASTINGS       │  ✅   │    ✅     │  ✅    │   -    │
│ VIEW PUBLIC CASTINGS     │  ✅   │    ✅     │  ✅    │  ✅    │
│ MANAGE CASTING           │  ✅   │    ✅     │   -    │   -    │
│                          │       │           │        │        │
│ VIEW APPLICATIONS        │  ✅   │    ✅     │  ✅    │   -    │
│ ACCEPT APPLICATION       │  ✅   │    ✅     │   -    │   -    │
│ REJECT APPLICATION       │  ✅   │    ✅     │   -    │   -    │
│ SHORTLIST CANDIDATE      │  ✅   │    ✅     │   -    │   -    │
├──────────────────────────┴───────┴───────────┴────────┴────────┤
│ * Public projects with status != 'archived' can be viewed       │
│ - = Not Applicable / No Access                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Notification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              NOTIFICATION SYSTEM FLOW                             │
└──────────────────────────────────────────────────────────────────┘

EVENT: Team Invitation Sent
│
├─ Trigger: POST /teamInvitations
├─ CreatedBy: Team Owner
├─ Recipient: Invitee
├─ Type: "invite"
├─ Status: Creates Notification in DB
├─ Channel: Email (via emailService)
└─ Message: "You have been invited to join {team.name} as {role}"
   │
   └─→ Invitee Gets Notified
      ├─ In-app notification badge
      ├─ Email notification
      └─ Can accept/reject from notification

EVENT: Invitation Accepted
│
├─ Trigger: POST /teamInvitations/accept
├─ ActedBy: Invitee
├─ Recipient: Team Owner (inviter)
├─ Type: "invite"
└─ Message: "{user.name} accepted your invite to {team.name}"

EVENT: Project Created
│
├─ Trigger: POST /projects
├─ CreatedBy: Team Member
├─ Recipients: All Team Members (except creator)
├─ Type: "project"
└─ Message: "New project {project.name} created in {team.name}"

EVENT: Role Added to Project
│
├─ Trigger: POST /projects/:id/roles
├─ CreatedBy: Team Member
├─ Recipients: All Team Members
├─ Type: "project"
└─ Message: "New role {role.name} added to {project.name}"

EVENT: Application Received
│
├─ Trigger: POST /casting/:id/apply
├─ CreatedBy: Actor
├─ Recipients: Team Owner & Project Creator
├─ Type: "application"
└─ Message: "New application for {role.name} from {actor.name}"
```

---

## 8. Complete Request-Response Cycle

```
┌──────────────────────────────────────────────────────────────────┐
│          PROJECT CREATION REQUEST FLOW                            │
└──────────────────────────────────────────────────────────────────┘

1. FRONTEND
   ┌──────────────────────────────────┐
   │ User fills project form           │
   │ ├─ Team ID                        │
   │ ├─ Project Name                   │
   │ ├─ Genre, Language, Location      │
   │ ├─ Dates (start, end)             │
   │ ├─ Description                    │
   │ └─ Roles Array                    │
   └─────────────┬──────────────────────┘
                 │
                 ↓ POST /api/v1/projects
   
2. BACKEND - REQUEST VALIDATION
   ┌──────────────────────────────────┐
   │ Auth Middleware                   │
   │ ├─ Verify JWT Token               │
   │ ├─ Extract User ID                │
   │ ├─ Check User Role (Producer)     │
   │ └─ Set req.user                   │
   │                                   │
   │ Authorization Check               │
   │ ├─ Fetch Team                     │
   │ ├─ Verify User is Team Member     │
   │ └─ Check User has permission      │
   └─────────────┬──────────────────────┘
                 │
                 ↓
   
3. BACKEND - PROJECT CREATION
   ┌──────────────────────────────────┐
   │ FilmProject.create({              │
   │   team: teamId,                   │
   │   name: name.trim(),              │
   │   genre, language, location,      │
   │   startDate, endDate,             │
   │   description,                    │
   │   createdBy: req.user._id,        │
   │   collaborators: [req.user._id],  │
   │   roles: roles || []              │
   │ })                                │
   │                                   │
   │ Database Operation:               │
   │ ├─ Insert Project Doc             │
   │ ├─ Generate ObjectId              │
   │ ├─ Set Timestamps                 │
   │ └─ Return Created Doc             │
   └─────────────┬──────────────────────┘
                 │
                 ↓
   
4. BACKEND - AUTO-GENERATE CASTINGS (Background)
   ┌──────────────────────────────────┐
   │ If roles exist:                   │
   │ ├─ For each role:                 │
   │ │  ├─ Parse skillsRequired         │
   │ │  ├─ Calculate dates              │
   │ │  ├─ Create CastingCall           │
   │ │  │  ├─ roleTitle                 │
   │ │  │  ├─ description               │
   │ │  │  ├─ ageRange                  │
   │ │  │  ├─ genderRequirement         │
   │ │  │  ├─ experienceLevel           │
   │ │  │  ├─ skillsRequired            │
   │ │  │  ├─ location                  │
   │ │  │  ├─ numberOfOpenings          │
   │ │  │  ├─ submissionDeadline        │
   │ │  │  ├─ auditionDate              │
   │ │  │  ├─ shootStartDate            │
   │ │  │  └─ shootEndDate              │
   │ │  └─ Database Insert              │
   │ │                                  │
   │ └─ Running in Background (Non-blocking)
   │    └─ Process continues below in parallel
   └─────────────┬──────────────────────┘
                 │
                 ↓
   
5. BACKEND - NOTIFICATIONS (Best-effort)
   ┌──────────────────────────────────┐
   │ Get Team Members:                 │
   │ ├─ Team Owner                     │
   │ ├─ All Members (excluding creator)│
   │ └─ Populate user details          │
   │                                   │
   │ For each team member:             │
   │ ├─ Create Notification            │
   │ │  ├─ user: member._id            │
   │ │  ├─ title: "New Project"        │
   │ │  ├─ message: "..."              │
   │ │  ├─ type: "project"             │
   │ │  ├─ relatedId: project._id      │
   │ │  └─ relatedType: "film-project" │
   │ │                                  │
   │ └─ Send Email/In-app              │
   │    (best-effort, non-blocking)    │
   └─────────────┬──────────────────────┘
                 │
                 ↓
   
6. BACKEND - RESPONSE
   ┌──────────────────────────────────┐
   │ res.status(201).json({            │
   │   success: true,                  │
   │   data: {                         │
   │     _id: "proj_123",              │
   │     team: "team_xyz",             │
   │     name: "...",                  │
   │     roles: [...],                 │
   │     status: "draft",              │
   │     createdAt: "...",             │
   │     ...                           │
   │   }                               │
   │ })                                │
   └─────────────┬──────────────────────┘
                 │
                 ↓ Response (201 Created)
   
7. FRONTEND - SUCCESS HANDLING
   ┌──────────────────────────────────┐
   │ ├─ Show success message           │
   │ ├─ Redirect to project page       │
   │ ├─ Display project details        │
   │ ├─ Show auto-generated castings   │
   │ └─ Allow next actions             │
   │    ├─ Add more roles              │
   │    ├─ Invite collaborators        │
   │    └─ Publish project             │
   └──────────────────────────────────┘
```

---

## 9. Database Relationships Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                  DATABASE ENTITY RELATIONSHIPS                  │
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │    User      │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ↓              ↓              ↓
      ┌──────────┐  ┌─────────────┐  ┌─────────────┐
      │Team Owner│  │Team Member  │  │Collaborator │
      │(1-to-many) │  │(many-to-many)│  │(many-to-many) │
      └────┬─────┘  └────┬────────┘  └────┬────────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ↓                                   ↓
   ┌────────────────┐           ┌─────────────────┐
   │ProductionTeam  │           │ FilmProject     │
   ├────────────────┤           ├─────────────────┤
   │ _id            │           │ _id             │
   │ name           │           │ team ──refs──→  │
   │ owner ─────────┼──────────→│ name            │
   │ members [      │           │ createdBy ──────┼→ User
   │   {            │           │ collaborators[] │
   │     user ──────┼─→ User    │ roles [         │
   │     role       │           │   RoleSchema    │
   │   }            │           │ ]               │
   │ ]              │           │ status          │
   └────────────────┘           └────┬───────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ↓                                ↓
           ┌─────────────────┐         ┌────────────────────┐
           │ TeamInvitation  │         │  CastingCall       │
           ├─────────────────┤         ├────────────────────┤
           │ _id             │         │ _id                │
           │ team ──refs──→  │         │ project ──refs──→  │
           │ invitedBy ──────┼─→ User  │ team ──refs──→     │
           │ invitee ────────┼─→ User  │ producer ──refs──→ │
           │ project         │         │ roleTitle          │
           │ role            │         │ description        │
           │ status          │         │ ageRange           │
           │ token           │         │ genderRequirement  │
           │ expiresAt       │         │ experienceLevel    │
           └─────────────────┘         │ skillsRequired     │
                                       │ location           │
                                       │ numberOfOpenings   │
                                       │ submissionDeadline │
                                       │ auditionDate       │
                                       │ shootStartDate     │
                                       │ shootEndDate       │
                                       │ status             │
                                       └────────────────────┘
```

---

## 10. Complete Feature Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│           FEATURE DEPENDENCY HIERARCHY                          │
└────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Authentication │
                    │   (User Signup) │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │ Create Team     │
                    │ (Team Setup)    │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ↓                         ↓
         ┌──────────────┐        ┌─────────────────┐
         │Invite Members│        │View Team Details│
         │(Collaboration)        │ (Team Overview) │
         └──────┬───────┘        └─────────────────┘
                │
                ↓
         ┌──────────────┐
         │Accept/Reject │
         │ Invitation   │
         │(Membership)  │
         └──────┬───────┘
                │
                ↓
         ┌──────────────────────────┐
         │ Create Film Project      │
         │ (Project Definition)     │
         └──────┬───────────────────┘
                │
                ↓
         ┌──────────────────────────┐
         │ Define Roles in Project  │
         │ (Role Specification)     │
         └──────┬───────────────────┘
                │
                ↓
         ┌──────────────────────────┐
         │ Auto-Generate Casting    │
         │ (Casting from Roles)     │
         └──────┬───────────────────┘
                │
                ↓
         ┌──────────────────────────┐
         │ Publish Project/Casting  │
         │ (Make Public)            │
         └──────┬───────────────────┘
                │
                ├─→ Actors Browse (Public API)
                │
                ↓
         ┌──────────────────────────┐
         │ Actors Apply to Casting  │
         │ (Applications)           │
         └──────┬───────────────────┘
                │
                ↓
         ┌──────────────────────────┐
         │ Team Reviews Applications│
         │ (Application Management) │
         └──────┬───────────────────┘
                │
                ├─→ Shortlist
                ├─→ Request Audition
                ├─→ Reject Candidate
                │
                ↓
         ┌──────────────────────────┐
         │ Finalize Casting         │
         │ (Hiring Decision)        │
         └──────────────────────────┘
```

This comprehensive visualization shows all the connections, flows, and relationships in the project creation and team collaboration system.
