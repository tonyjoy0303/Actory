# Quick Testing Guide

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:8080` (or your configured port)
- Two test producer accounts logged in (different tabs or browsers)
- One test actor account

---

## Test Scenario 1: Create Project with Roles

### Step 1: Create a Production Team
1. Login as Producer (if not already)
2. Go to `/teams`
3. Click "Create Team"
4. Fill in:
   - Team Name: "Test Production House"
   - Production House: "Test House Inc"
   - Description: "Test team"
5. Click "Create"
6. **Expected**: Team created successfully, navigate to Teams page

### Step 2: Create a Project
1. Go to `/projects`
2. Click "Create Film Project"
3. Fill in the form:
   - Project Title: "Summer Action Film"
   - Project Type: "Feature Film"
   - Genre: "Action"
   - Language: "English"
   - Production House: "Test House Inc"
   - Synopsis: "An action-packed thriller about..."
   - Project Status: "Planning"
   - Team ID: Select the team you just created
4. Scroll down and add roles:
   - Click "Add Role"
   - Role Name: "Lead Actor"
   - Role Type: "Lead"
   - Min Age: 25
   - Max Age: 35
   - Gender: "Male"
   - Experience: "Professional"
   - Click "Add Role" button
5. Click "Create Project"
6. **Expected**: Project created successfully

### Step 3: Verify Notification
1. **If you have a second producer in the team**:
   - Open notification bell icon
   - Should see: "New project created - Summer Action Film was created in team Test Production House"

---

## Test Scenario 2: Add Role to Project & Create Casting

### Step 1: Open Project Details
1. Go to `/projects`
2. Click on the "Summer Action Film" project
3. **Expected**: ProjectDetails page loads with project information

### Step 2: Add Another Role
1. Click "Add Role" button
2. Fill in:
   - Role Name: "Villain"
   - Role Type: "Supporting"
   - Min Age: 30
   - Max Age: 45
   - Gender: "Female"
   - Experience: "Professional"
   - Skills: "Acting, Sword Fighting, Stunts"
   - Role Description: "The main antagonist"
3. Click "Add Role"
4. **Expected**: 
   - Dialog closes
   - New role appears in roles list
   - Team members get notification about new role

### Step 3: Create Casting from Role
1. In the roles section, find "Villain" role
2. Click "Create Casting" button
3. Fill in casting details:
   - Description: "We're looking for an experienced actress to play the main villain..."
   - Location: "Mumbai"
   - Submission Deadline: 5 days from now
   - Audition Date: 7 days from now
4. Click "Create Casting"
5. **Expected**:
   - Dialog closes
   - Role now shows "Casting Created" badge
   - Team members get notification: "New casting call posted: Villain in Summer Action Film is now open"

---

## Test Scenario 3: View Casting as Team Member

### Step 1: Switch to Second Producer (Same Team)
1. Open a new incognito/private browser window
2. Login as a different producer account
3. Add them to the same team:
   - First producer invites second producer to team
   - Second producer accepts invitation

### Step 2: View Team Castings
1. Second producer goes to `/casting`
2. Clicks "My Team Castings" button
3. **Expected**:
   - Shows "Villain" casting with project name "Summer Action Film"
   - Shows producer name
   - Shows submission deadline

### Step 3: View Casting Details
1. Click on the "Villain" casting card
2. **Expected**: Casting details page shows:
   - Role title: "Villain"
   - Project: "Summer Action Film"
   - Requirements: Female, 30-45 years, Professional
   - Required skills
   - Producer name
   - Submission deadline
   - "Apply Now" button

---

## Test Scenario 4: Actor Applies for Casting

### Step 1: Login as Actor
1. Open another incognito window
2. Login as actor account
3. Go to `/casting`

### Step 2: Browse Casting
1. Should see "Villain" casting in the list
2. Can filter by:
   - Experience level: "Professional"
   - Gender: "Female"
   - Location
   - Age range

### Step 3: Apply for Casting
1. Click on "Villain" casting
2. View all details
3. Click "Apply Now"
4. Submit audition:
   - Upload video
   - Fill in personal details
   - Skills
   - Age, height, location
5. Click "Submit"
6. **Expected**: 
   - Success message shown
   - Redirect to casting page
   - Application saved

---

## Test Scenario 5: Producer Views Applications

### Step 1: Go to Producer Dashboard
1. First producer goes to `/dashboard/producer`

### Step 2: View Casting
1. Should see "Villain" casting
2. Click "View Submissions"

### Step 3: View Applications
1. Dialog opens showing:
   - Actor name
   - Audition video preview
   - Actor age, height, location
   - Submission date
   - Quality assessment score
   - Status (Pending, Accepted, Rejected)

### Step 4: Sort Submissions
1. Use dropdown to sort by:
   - "Date (Newest)" - Most recent first
   - "Date (Oldest)" - Oldest first
   - "Name (A-Z)" - Alphabetical
   - "Quality (High to Low)" - Best quality first
   - "Status - Accepted" - Accepted applications first
2. **Expected**: List reorders based on selected sort

---

## Test Scenario 6: Verify All Notifications

### Team Member 1 (Creator) Checklist:
- [ ] Created project successfully
- [ ] Added first role (Lead Actor)
- [ ] Added second role (Villain)
- [ ] Created casting for Villain role
- [ ] Received notifications for all team activities

### Team Member 2 (Invited) Checklist:
- [ ] Received notification: "New project created"
- [ ] Received notification: "New role added" (for Lead Actor)
- [ ] Received notification: "New role added" (for Villain)
- [ ] Received notification: "New casting call posted" (for Villain)
- [ ] Can see all castings on /casting with "My Team Castings" filter
- [ ] Can see project and roles in /projects

### Actor Checklist:
- [ ] Can see all public castings on /casting
- [ ] Can apply for casting
- [ ] Submission appears in producer's dashboard
- [ ] Can view casting details with project name

---

## Common Issues & Solutions

### Issue 1: Casting not showing project name
**Solution**: Ensure backend API populates project in getCastingCalls response
```javascript
.populate('project', 'name description')
```

### Issue 2: Team members not receiving notifications
**Solution**: Check that notification service is initialized
1. Ensure `/notifications` socket is connected
2. Check browser console for errors
3. Verify user IDs in database

### Issue 3: Casting creation fails with date error
**Solution**: Ensure dates are in correct format and order
- submissionDeadline MUST be before auditionDate
- auditionDate MUST be before shootStartDate
- All dates must be in future

### Issue 4: Cannot add role to project
**Solution**: Check that:
- User is team member
- Role name is not empty
- Project ID is valid

### Issue 5: Team members can't see castings
**Solution**: 
- Verify `team` field is set on casting call
- Check user is in team members list
- API returns correct team castings

---

## Database Verification

### Check Project Structure
```javascript
// In MongoDB
db.filmprojects.findOne({ name: "Summer Action Film" })

// Should show:
{
  _id: ObjectId(...),
  team: ObjectId(...),
  name: "Summer Action Film",
  genre: "Action",
  roles: [
    {
      _id: ObjectId(...),
      roleName: "Lead Actor",
      roleType: "Lead",
      ageMin: 25,
      ageMax: 35,
      gender: "Male",
      experienceLevel: "Professional",
      castingCallId: ObjectId(...),
      ...
    },
    {
      _id: ObjectId(...),
      roleName: "Villain",
      roleType: "Supporting",
      ageMin: 30,
      ageMax: 45,
      gender: "Female",
      experienceLevel: "Professional",
      castingCallId: ObjectId(...),
      ...
    }
  ]
}
```

### Check Casting Structure
```javascript
// In MongoDB
db.castingcalls.findOne({ roleTitle: "Villain" })

// Should show:
{
  _id: ObjectId(...),
  roleTitle: "Villain",
  producer: ObjectId(...),
  project: ObjectId(...),  // NEW
  projectRole: ObjectId(...),  // NEW
  team: ObjectId(...),  // NEW
  ageRange: { min: 30, max: 45 },
  genderRequirement: "female",
  experienceLevel: "professional",
  auditionDate: Date(...),
  submissionDeadline: Date(...),
  ...
}
```

### Check Notifications
```javascript
// In MongoDB
db.notifications.find({ type: "casting" })

// Should show notifications for each casting created
```

---

## Frontend Routes to Test

| Route | Purpose | Expected |
|-------|---------|----------|
| `/teams` | Create and manage teams | Create, invite members, view teams |
| `/projects` | List projects | View all projects user has access to |
| `/projects/:id` | Project details | View project, add roles, create castings |
| `/casting` | Browse all castings | Search, filter, "My Team Castings" button |
| `/casting/:id` | Casting details | View requirements, Apply button, project name |
| `/audition/submit/:castingId` | Apply for casting | Submit audition video and details |
| `/dashboard/producer` | Producer dashboard | View castings, view submissions, manage status |

---

## Success Criteria

### ✅ Project Creation with Roles
- [ ] Project created with team reference
- [ ] Roles can be added to project
- [ ] Each role has complete information
- [ ] Role ID stored in database

### ✅ Casting from Roles
- [ ] Casting created from role inherits requirements
- [ ] Casting linked to project and role
- [ ] Role updated with castingCallId
- [ ] Casting appears on public /casting page

### ✅ Team Member Visibility
- [ ] All team members notified of project creation
- [ ] All team members notified of new roles
- [ ] All team members notified of new castings
- [ ] Team members can filter "My Team Castings"
- [ ] Castings show project name

### ✅ Application Management
- [ ] Actors can apply for castings
- [ ] Applications appear in producer dashboard
- [ ] Applications show correct casting and actor info
- [ ] Producer can view all applications
- [ ] Submissions can be sorted/filtered

