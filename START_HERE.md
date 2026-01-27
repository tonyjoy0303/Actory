# 🎯 Project Creation & Team Collaboration - Start Here

## Welcome! 👋

You've received **7 comprehensive documents** explaining how Actory's project creation and team collaboration system works.

**Don't know where to start?** Use this guide!

---

## ⏱️ Choose Your Path by Time Available

### "I have 5 minutes" ⚡
Read this page only. You'll get the essentials.

### "I have 15 minutes" 🔥
**1. This page** (5 min)
**2. PROJECT_CREATION_EXECUTIVE_SUMMARY.md** (10 min)

### "I have 1 hour" 🎯
**1. This page** (5 min)
**2. PROJECT_CREATION_EXECUTIVE_SUMMARY.md** (15 min)
**3. PROJECT_CREATION_VISUAL_FLOWS.md** (20 min)
**4. Skim PROJECT_CREATION_AND_TEAM_COLLABORATION_GUIDE.md** (20 min)

### "I have 2 hours" 💻
**1. This page** (5 min)
**2. PROJECT_CREATION_EXECUTIVE_SUMMARY.md** (15 min)
**3. PROJECT_CREATION_VISUAL_FLOWS.md** (20 min)
**4. PROJECT_CREATION_AND_TEAM_COLLABORATION_GUIDE.md** (40 min)
**5. PROJECT_CREATION_CODE_REFERENCE.md** (20 min - specific sections)
**6. PROJECT_CREATION_TROUBLESHOOTING.md** (20 min)

---

## 🗺️ The Simplest Explanation

### What is Actory's Project System?

It's a **platform for production teams to:**

1. **Create Teams** - Group people for collaboration
2. **Create Projects** - Film/production projects
3. **Define Roles** - Job positions needed (e.g., "Lead Hero")
4. **Generate Castings** - Auto-created from roles (system does this!)
5. **Receive Applications** - Actors apply to castings
6. **Manage Hiring** - Team reviews and selects candidates

### The Magic 🌟

**System automatically creates casting calls from role definitions!**

You define: "We need a Lead Hero, age 28-38, Male, Professional Actor"
System creates: Public casting call with all that info

No manual data entry. It just works. 🎉

---

## 👥 Four Types of Users

### 1. **Producer** (Team Owner)
- Creates teams
- Invites team members
- Creates projects
- Manages everything
- **Full control**

### 2. **Recruiter** (Team Member)
- Invited to join team
- Creates projects with producer
- Defines roles
- Manages castings
- Reviews applications
- **Can do almost everything**

### 3. **Viewer** (Team Member)
- Invited to team
- Views projects
- Views casting calls
- Views applications
- **Read-only access**

### 4. **Actor** (General User)
- Browses public castings
- Applies with video
- Checks application status
- Views feedback
- **Can apply**

---

## 🔄 The Complete Flow (6 Steps)

```
STEP 1: Producer Creates Team
  └─→ Team created, producer is owner

STEP 2: Producer Invites Recruiter
  └─→ Email invitation sent with unique token
  └─→ Expires in 48 hours

STEP 3: Recruiter Accepts Invitation
  └─→ Recruiter joins team
  └─→ Gets "Recruiter" role

STEP 4: Recruiter Creates Project with Roles
  POST /api/v1/projects
  {
    teamId: "...",
    name: "Monsoon Action Drama",
    roles: [
      { roleName: "Lead Hero", ageMin: 28, ageMax: 38, ... },
      { roleName: "Lead Heroine", ageMin: 25, ageMax: 35, ... }
    ]
  }

STEP 5: System Auto-Generates Castings (Background)
  ✨ For each role, system creates a CastingCall
  ✨ Inherits all role specifications
  ✨ Castings become searchable immediately

STEP 6: Actors Discover & Apply
  GET /api/v1/casting?gender=male&location=goa
  └─→ Actors see "Lead Hero" casting
  └─→ Actors apply with video
  └─→ Team reviews and selects candidates
```

---

## 🔑 Key Concepts

### **ProductionTeam**
Container for collaboration. Has owner and members.

```
Example:
- Team: "Monsoon Productions"
- Owner: John (can do everything)
- Members: 
  - Jane (Recruiter - can create projects)
  - Bob (Viewer - read-only)
```

### **FilmProject**
Project that belongs to a team. Contains roles.

```
Example:
- Project: "Monsoon Action Drama"
- Team: "Monsoon Productions"
- Roles: [Lead Hero, Lead Heroine, Villain]
- Status: draft / active / archived
```

### **Role**
Job position needed in a project.

```
Example:
- Role Name: "Lead Hero"
- Age: 28-38
- Gender: Male
- Skills: Acting, Martial Arts, Horse Riding
- Experience: Professional
- Openings: 1
```

### **CastingCall**
Public job posting auto-created from role.

```
Auto-created from role:
- Title: "Lead Hero"
- Age Range: 28-38
- Gender: Male
- Skills: Acting, Martial Arts, Horse Riding
- Experience: Professional
- Visible to: All actors (public)
```

### **TeamInvitation**
How people join teams. Email-based with token.

```
Example:
- From: john@example.com
- To: jane@example.com
- Team: "Monsoon Productions"
- Role: "Recruiter"
- Token: abc123def456... (unique)
- Expires: 48 hours
- Status: pending → accepted/rejected/expired
```

---

## 📊 Permissions Quick Reference

| Action | Owner | Recruiter | Viewer | Actor |
|--------|-------|-----------|--------|-------|
| Create Team | ✅ | - | - | - |
| Invite Members | ✅ | - | - | - |
| Create Project | ✅ | ✅ | - | - |
| Add Roles | ✅ | ✅ | - | - |
| View Projects | ✅ | ✅ | ✅ | ✅* |
| View Castings | ✅ | ✅ | ✅ | ✅ |
| Manage Applications | ✅ | ✅ | - | - |
| Apply to Casting | - | - | - | ✅ |

*Actors can only see active projects (not draft)

---

## 🚀 Quick API Reference

### Teams
```
POST   /api/v1/teams              Create team
GET    /api/v1/teams              Get my teams
GET    /api/v1/teams/:id          Get team details
```

### Projects
```
POST   /api/v1/projects           Create project
GET    /api/v1/projects           Get my projects
POST   /api/v1/projects/:id/roles Add role
```

### Invitations
```
POST   /api/v1/teamInvitations        Send invite
POST   /api/v1/teamInvitations/accept Accept
```

### Casting
```
GET    /api/v1/casting            Browse castings
GET    /api/v1/casting/team/:id   Team castings
```

---

## 💡 What Makes This System Special?

### 1. **Auto-Casting Generation** ✨
Define roles → System creates castings automatically
No manual work. Reduces errors. Saves time.

### 2. **Token-Based Invitations** 🔐
Team members join via email link with unique token
Secure, trackable, time-limited (48 hours)

### 3. **Role-Based Permissions** 🛡️
- Owner: Full control
- Recruiter: Can create projects
- Viewer: Read-only
- Fine-grained control

### 4. **Team Collaboration** 👥
Multiple recruiters can work on same projects
Everyone gets notified of changes
Fully collaborative

### 5. **Non-Blocking Background Processes** ⚡
Castings generated in background
Users get immediate response
System continues working

---

## 🐛 Something Not Working?

### Check the Troubleshooting Guide
**File**: PROJECT_CREATION_TROUBLESHOOTING.md

Common issues covered:
- Can't create team
- Invitation token invalid
- Can't create project
- Casting not visible
- Permission denied
- And more...

---

## 📚 Full Documentation

### 1. Executive Summary (15 pages)
Quick overview of everything
**→ Read this first**

### 2. Main Guide (45 pages)
Complete detailed reference
**→ Read when you need full details**

### 3. Visual Flows (20 pages)
Diagrams showing relationships
**→ Read if you're visual learner**

### 4. Code Reference (30 pages)
API endpoints with examples
**→ Read when implementing**

### 5. Data Models (25 pages)
Database schema details
**→ Read when querying database**

### 6. Documentation Index (15 pages)
Navigation guide for all documents
**→ Use to find what you need**

### 7. Troubleshooting (20 pages)
Problem solving guide
**→ Read when debugging**

---

## ✅ Checklist: You're Ready When You Know...

### Conceptual Understanding
- [ ] What a ProductionTeam is
- [ ] What roles are and what casting calls are
- [ ] How the system auto-generates castings
- [ ] The 6-step project creation flow
- [ ] The 4 user types and their permissions

### Technical Understanding
- [ ] The 5 main data models
- [ ] The 21 API endpoints
- [ ] How authorization works
- [ ] How notifications work
- [ ] What the status enums mean

### Practical Understanding
- [ ] How to create a team
- [ ] How to invite members
- [ ] How to create a project
- [ ] How to add roles
- [ ] How to debug permission issues

---

## 🎓 What You'll Learn

### After Reading Everything:
✅ Complete system understanding
✅ Can implement new features
✅ Can debug issues
✅ Can optimize queries
✅ Can onboard others
✅ Can design similar systems

### After Reading Just Executive Summary:
✅ Basic understanding
✅ Know what the system does
✅ Understand user flows
✅ Know permissions

### After Reading Code Reference:
✅ How to call APIs
✅ Request/response formats
✅ Error codes
✅ Code examples

---

## 🔗 Where to Go Next

**If you have 10 minutes:**
→ Keep reading this page

**If you have 30 minutes:**
→ Read: PROJECT_CREATION_EXECUTIVE_SUMMARY.md

**If you have 1 hour:**
→ Read: EXECUTIVE_SUMMARY + VISUAL_FLOWS

**If you have 2 hours:**
→ Read: All above + MAIN_GUIDE (first 5 sections)

**If you're implementing:**
→ Go straight to: PROJECT_CREATION_CODE_REFERENCE.md

**If you're debugging:**
→ Go straight to: PROJECT_CREATION_TROUBLESHOOTING.md

**If you're lost:**
→ Read: PROJECT_CREATION_DOCUMENTATION_INDEX.md (navigation guide)

---

## 🎯 Your Immediate Next Step

Pick based on your situation:

**A) "I want overview"**
→ Read: PROJECT_CREATION_EXECUTIVE_SUMMARY.md

**B) "I'm visual learner"**
→ Read: PROJECT_CREATION_VISUAL_FLOWS.md

**C) "I'm implementing something"**
→ Read: PROJECT_CREATION_CODE_REFERENCE.md

**D) "I need to debug"**
→ Read: PROJECT_CREATION_TROUBLESHOOTING.md

**E) "I'm lost, help!"**
→ Read: PROJECT_CREATION_DOCUMENTATION_INDEX.md

---

## 📞 Quick Facts

- **Total Documentation**: 135 pages
- **API Endpoints**: 21 documented
- **Code Examples**: 25+ included
- **Data Models**: 5 covered
- **Diagrams**: 25+ visuals
- **User Roles**: 4 with permissions
- **Troubleshooting**: 15+ scenarios

---

## 🚀 You're All Set!

You have everything you need to understand Actory's project creation and team collaboration system.

**Ready?**

### START HERE → PROJECT_CREATION_EXECUTIVE_SUMMARY.md

(Takes 15 minutes. Worth it!)

---

**Happy learning! 🎉**
