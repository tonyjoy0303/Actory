# Project Creation & Team Collaboration - Troubleshooting Guide

## Quick Problem Solver

This guide helps you diagnose and fix common issues in the project creation and team collaboration system.

---

## Team-Related Issues

### Problem: "User cannot create a team"

**Symptoms:**
- 403 Forbidden error
- Message: "Not authorized to perform this action"

**Possible Causes:**
1. User doesn't have required role
2. User is not authenticated
3. JWT token expired

**Solutions:**

```javascript
// 1. Check user role
// User must have role: "Producer" or "ProductionTeam"
const user = await User.findById(userId);
console.log('User role:', user.role); // Should be "Producer" or "ProductionTeam"

// 2. Check authentication
// In browser, verify token exists:
console.log('Token:', localStorage.getItem('token')); // Should not be null

// 3. Verify token not expired
// Token might be expired, need to re-login
// Clear and re-authenticate
```

**API Response Check:**
```bash
curl -X POST http://localhost:5000/api/v1/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Test Team"}'

# If 403: Authorization issue
# If 401: Authentication issue
# If 400: Validation issue (missing fields)
```

---

### Problem: "Team creation succeeded but user not added as owner"

**Symptoms:**
- Team created successfully
- Querying team shows no owner or wrong owner
- Team members empty

**Possible Causes:**
1. Database transaction failed
2. User document deleted
3. Race condition in code

**Solutions:**

```javascript
// Verify team was created correctly
const team = await ProductionTeam.findById(teamId).populate('owner');
console.log('Owner:', team.owner);
console.log('Members:', team.members);

// Both should include the creator
// If not, check:
// 1. Did save() succeed?
// 2. Is owner field populated?
```

**Fix:**
```javascript
// Manually repair if needed
const team = await ProductionTeam.findById(teamId);
const user = await User.findById(userId);

if (!team.owner) {
  team.owner = user._id;
  team.members.push({ user: user._id, role: 'Owner' });
  await team.save();
  console.log('Team repaired');
}
```

---

### Problem: "Cannot remove team member"

**Symptoms:**
- 403 Forbidden
- Member not removed
- Only owner can remove message, but user is owner

**Possible Causes:**
1. User ID mismatch (string vs ObjectId)
2. Authorization check failing
3. Member not in team

**Solutions:**

```javascript
// 1. Check ID types and equality
const team = await ProductionTeam.findById(teamId);
console.log('Team owner:', team.owner, typeof team.owner);
console.log('Req user:', req.user._id, typeof req.user._id);

// Compare as strings
if (String(team.owner) === String(req.user._id)) {
  console.log('Owner check passed');
} else {
  console.log('Owner check failed');
}

// 2. Verify member exists
const memberExists = team.members.some(m => 
  String(m.user) === String(memberId)
);
console.log('Member exists:', memberExists);

// 3. Try removal manually
team.members = team.members.filter(m => 
  String(m.user) !== String(memberId)
);
await team.save();
```

---

## Invitation-Related Issues

### Problem: "Invitation token invalid or expired"

**Symptoms:**
- 404 Not found
- Message: "Invitation not found"
- User followed link from email but can't accept

**Possible Causes:**
1. Token doesn't match any invitation
2. Invitation expired (> 48 hours)
3. Invitation already accepted
4. Wrong token format

**Solutions:**

```javascript
// 1. Check token format
const token = 'abc123def456...'; // From URL param
if (!token || token.length < 20) {
  console.log('Token invalid format');
}

// 2. Query invitation directly
const invitation = await TeamInvitation.findOne({ token });
if (!invitation) {
  console.log('Token not found in database');
  // Send new invitation
}

// 3. Check expiration
const now = new Date();
if (invitation.expiresAt < now) {
  console.log('Invitation expired');
  // Send new invitation
}

// 4. Check status
console.log('Invitation status:', invitation.status);
if (invitation.status !== 'pending') {
  console.log('Invitation already processed');
}
```

**Fix:**

```javascript
// Re-send invitation if expired
if (invitation.expiresAt < new Date()) {
  // Delete old
  await TeamInvitation.deleteOne({ _id: invitation._id });
  
  // Create new
  const newInvitation = await TeamInvitation.create({
    team: invitation.team,
    invitedBy: invitation.invitedBy,
    invitee: invitation.invitee,
    role: invitation.role,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  });
  
  // Send email with new token
  console.log('New token:', newInvitation.token);
}
```

---

### Problem: "User cannot accept invitation"

**Symptoms:**
- 403 Forbidden
- Message: "Not your invitation"
- User is the correct invitee but still getting error

**Possible Causes:**
1. Authenticated user != invitee
2. User logged in as different account
3. Invitee field corrupted

**Solutions:**

```javascript
// 1. Check authenticated user
console.log('Auth user ID:', req.user._id);

// 2. Check invitee field
const invitation = await TeamInvitation.findById(invitationId);
console.log('Invitee ID:', invitation.invitee);
console.log('Match:', String(invitation.invitee) === String(req.user._id));

// 3. Verify email addresses match
const authUser = await User.findById(req.user._id);
const invitedUser = await User.findById(invitation.invitee);
console.log('Auth email:', authUser.email);
console.log('Invited email:', invitedUser.email);

// 4. If emails match, fix the IDs
if (authUser.email === invitedUser.email) {
  invitation.invitee = req.user._id;
  await invitation.save();
  console.log('Fixed invitee ID');
}
```

---

### Problem: "User already in team when accepting invitation"

**Symptoms:**
- 400 Bad Request
- Message: "User is already in the team"
- But user is not actually in team

**Possible Causes:**
1. Race condition (multiple accept requests)
2. User added manually while invitation pending
3. Former member re-invited

**Solutions:**

```javascript
// 1. Check team membership
const team = await ProductionTeam.findById(invitation.team);
const isMember = String(team.owner) === String(req.user._id) ||
  team.members.some(m => String(m.user) === String(req.user._id));

console.log('Is member:', isMember);

// 2. If false positive, reset team
if (!isMember) {
  // Clear and re-add
  team.members = team.members.filter(m => 
    String(m.user) !== String(req.user._id)
  );
  team.members.push({ user: req.user._id, role: invitation.role });
  await team.save();
  console.log('Team membership fixed');
}
```

---

## Project-Related Issues

### Problem: "Cannot create project in team"

**Symptoms:**
- 403 Forbidden
- Message: "Not authorized for this team"
- User is team member but still getting error

**Possible Causes:**
1. User not recognized as team member
2. ID type mismatch
3. User removed from team since login

**Solutions:**

```javascript
// 1. Verify team membership
const team = await ProductionTeam.findById(teamId);
console.log('Team owner:', team.owner);
console.log('Team members:', team.members.map(m => m.user));
console.log('Request user:', req.user._id);

// 2. Check membership logic
const isOwner = String(team.owner) === String(req.user._id);
const isMember = team.members.some(m => 
  String(m.user) === String(req.user._id)
);

console.log('Is owner:', isOwner);
console.log('Is member:', isMember);
console.log('Can create:', isOwner || isMember);

// 3. If not member, add them
if (!isOwner && !isMember) {
  team.members.push({ user: req.user._id, role: 'Recruiter' });
  await team.save();
  console.log('User added to team');
}
```

---

### Problem: "Project created but roles not added"

**Symptoms:**
- Project created successfully
- Roles array is empty
- Castings not auto-generated

**Possible Causes:**
1. Roles not passed in request
2. Background generation failed
3. Roles validation failed

**Solutions:**

```javascript
// 1. Check roles in request
const roles = req.body.roles;
console.log('Roles provided:', roles);
console.log('Roles length:', roles?.length);

// 2. Check project after creation
const project = await FilmProject.findById(projectId);
console.log('Project roles:', project.roles);
console.log('Number of roles:', project.roles.length);

// 3. Check if background process started
// Look in logs for: "auto-generating castings"
// or "error auto-generating castings"

// 4. Manually check castings
const castings = await CastingCall.find({ project: projectId });
console.log('Auto-generated castings:', castings.length);

// 5. If no castings, trigger generation manually
if (castings.length === 0 && project.roles.length > 0) {
  // Run casting generation
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  
  for (const role of project.roles) {
    await CastingCall.create({
      project: project._id,
      team: project.team,
      producer: project.createdBy,
      roleTitle: role.roleName,
      description: role.roleDescription,
      ageRange: { min: role.ageMin, max: role.ageMax },
      genderRequirement: role.gender?.toLowerCase() || 'any',
      experienceLevel: role.experienceLevel?.toLowerCase() || 'beginner',
      skillsRequired: role.skillsRequired || [],
      location: project.location,
      numberOfOpenings: role.numberOfOpenings || 1,
      submissionDeadline: sevenDays,
      status: 'open'
    });
  }
  console.log('Castings created manually');
}
```

---

### Problem: "Cannot delete project"

**Symptoms:**
- 403 Forbidden
- Message: "Only project creator can delete"
- But user is the creator

**Possible Causes:**
1. User ID mismatch
2. CreatedBy field incorrect
3. User no longer has same ID

**Solutions:**

```javascript
// 1. Check who created project
const project = await FilmProject.findById(projectId);
console.log('Created by:', project.createdBy);
console.log('Request user:', req.user._id);
console.log('Match:', String(project.createdBy) === String(req.user._id));

// 2. Check team ownership as fallback
const team = await ProductionTeam.findById(project.team);
const isTeamOwner = String(team.owner) === String(req.user._id);
console.log('Is team owner:', isTeamOwner);

// 3. If team owner but not creator, still allow deletion
if (isTeamOwner) {
  // Delete project
  const deleted = await FilmProject.deleteOne({ _id: projectId });
  console.log('Project deleted by team owner');
}
```

---

## Casting-Related Issues

### Problem: "Casting calls not visible to public"

**Symptoms:**
- Created castings but GET /api/v1/casting returns empty
- Castings visible in team endpoint but not public

**Possible Causes:**
1. Project status is 'draft' (not active)
2. Submission deadline passed
3. Audition date in past
4. Query filters excluding results

**Solutions:**

```javascript
// 1. Check project status
const project = await FilmProject.findById(projectId);
console.log('Project status:', project.status);

// For castings to be public:
// project.status must be 'active' OR 'archived'
// NOT 'draft'

if (project.status === 'draft') {
  // Publish project
  project.status = 'active';
  await project.save();
  console.log('Project published');
}

// 2. Check casting dates
const casting = await CastingCall.findById(castingId);
const now = new Date();

console.log('Now:', now);
console.log('Submission deadline:', casting.submissionDeadline);
console.log('Audition date:', casting.auditionDate);

if (casting.submissionDeadline < now) {
  console.log('Submission deadline passed');
  // Extend dates or create new casting
}

// 3. Check public query filters
const castings = await CastingCall.find({
  $and: [
    { auditionDate: { $gte: new Date() } },
    { submissionDeadline: { $gte: new Date() } }
  ]
});
console.log('Castings matching filters:', castings.length);

// 4. Check if project archived (excludes castings)
const archivedProjects = await FilmProject.find({ status: 'archived' });
const archivedCastings = await CastingCall.find({
  project: { $in: archivedProjects.map(p => p._id) }
});
console.log('Castings for archived projects:', archivedCastings.length);
// These are excluded from public listing
```

---

### Problem: "Wrong data in casting call"

**Symptoms:**
- Casting has incorrect requirements
- Age range wrong
- Skills don't match role
- Location not correct

**Possible Causes:**
1. Role data was malformed
2. Casting created before role finalized
2. Manual casting creation with wrong data
3. Database corruption

**Solutions:**

```javascript
// 1. Check source role
const project = await FilmProject.findById(castingId).populate('roles');
const role = project.roles.find(r => r._id === roleId);

console.log('Role name:', role.roleName);
console.log('Role age range:', role.ageMin, '-', role.ageMax);
console.log('Role skills:', role.skillsRequired);

// 2. Compare with casting
const casting = await CastingCall.findById(castingId);

console.log('Casting title:', casting.roleTitle);
console.log('Casting age range:', casting.ageRange);
console.log('Casting skills:', casting.skillsRequired);

// 3. If mismatch, update casting
if (String(casting.ageRange.min) !== String(role.ageMin)) {
  casting.ageRange.min = role.ageMin;
  casting.ageRange.max = role.ageMax;
  casting.skillsRequired = role.skillsRequired;
  await casting.save();
  console.log('Casting updated from role');
}
```

---

## Permission & Authorization Issues

### Problem: "403 Forbidden for authorized user"

**Symptoms:**
- 403 error even though user should have access
- Different users get different errors
- Same request works sometimes, fails other times

**Possible Causes:**
1. Role not correctly set
2. Team membership issue
3. Authorization check bug
4. Session/token issue

**Solutions:**

```javascript
// 1. Check user role and permissions
const user = await User.findById(req.user._id);
console.log('User role:', user.role);

// For team operations:
// User role must be: 'Producer' OR 'ProductionTeam'
// Admin role also works

// 2. Check team membership
const team = await ProductionTeam.findById(teamId);
const isOwner = String(team.owner) === String(req.user._id);
const isMember = team.members.some(m => 
  String(m.user) === String(req.user._id)
);

console.log('Is team owner:', isOwner);
console.log('Is team member:', isMember);
console.log('Can access:', isOwner || isMember);

// 3. Check member role within team
if (isMember) {
  const memberRole = team.members.find(m => 
    String(m.user) === String(req.user._id)
  ).role;
  console.log('Member role in team:', memberRole);
  
  // Recruiter can create projects
  // Viewer can only view
  // Owner can do everything
}

// 4. Verify middleware is working
// Check auth.js middleware:
// - Is token being verified?
// - Is user being attached to req?
// - Is role being checked?
```

---

## Database Issues

### Problem: "Duplicate key error on team creation"

**Symptoms:**
- E11000 duplicate key error
- Team creation fails intermittently
- Some fields marked unique?

**Possible Causes:**
1. Team name must be unique (wrong assumption)
2. Index not created properly
3. Partial index issue

**Solutions:**

```javascript
// ProductionTeam doesn't have unique constraint on name
// But there might be an old index
// Drop and recreate:

// In MongoDB:
db.productionteams.dropIndex("name_1"); // if exists
db.productionteams.createIndex({ name: 1 }); // non-unique

// Or in code:
const collection = db.collection('productionteams');
await collection.dropIndex('name_1').catch(() => null);
```

---

### Problem: "Slow queries for large teams"

**Symptoms:**
- Getting team details is slow
- Listing projects takes time
- Database queries timing out

**Possible Causes:**
1. Missing indexes
2. N+1 queries
3. Large members array
4. Population loading too much data

**Solutions:**

```javascript
// 1. Ensure indexes exist
db.productionteams.createIndex({ owner: 1 });
db.productionteams.createIndex({ "members.user": 1 });
db.filmprojects.createIndex({ team: 1 });
db.filmprojects.createIndex({ collaborators: 1 });
db.castingcalls.createIndex({ team: 1 });
db.castingcalls.createIndex({ status: 1, submissionDeadline: 1 });

// 2. Limit population
// Instead of:
const team = await ProductionTeam.findById(teamId).populate('members.user');

// Consider:
const team = await ProductionTeam.findById(teamId);
// Only populate when needed

// 3. Use projections
const team = await ProductionTeam.findById(teamId).select('name owner members');

// 4. Pagination for large result sets
const teams = await ProductionTeam.find()
  .limit(20)
  .skip((page - 1) * 20)
  .sort({ createdAt: -1 });
```

---

## Notification Issues

### Problem: "Users not notified of actions"

**Symptoms:**
- Team members don't get notifications
- Notifications in DB but not delivered
- Email not sent

**Possible Causes:**
1. Notification service not running
2. Email service not configured
3. Notifications marked as non-blocking (failures ignored)
4. User email address invalid

**Solutions:**

```javascript
// 1. Check notification in database
const notification = await Notification.findOne({ user: userId });
console.log('Notification exists:', !!notification);
console.log('Notification type:', notification?.type);

// 2. Check email service config
const emailConfig = process.env.EMAIL_SERVICE;
console.log('Email service configured:', !!emailConfig);

// 3. Manually send notification
await createNotification({
  user: userId,
  title: 'Test Notification',
  message: 'Testing notification system',
  type: 'test'
});

// 4. Check user email
const user = await User.findById(userId);
console.log('User email:', user.email);
console.log('Email valid:', user.email && user.email.includes('@'));

// 5. For critical notifications, make them blocking
// In controller, don't use .catch(() => null) for critical notifications
try {
  await createNotification({...});
} catch (err) {
  console.error('Critical notification failed:', err);
  // Don't swallow error for critical notifications
}
```

---

## Debugging Checklist

### When something doesn't work:

- [ ] **Check authentication**: Is user logged in? Valid token?
- [ ] **Check authorization**: Does user have required role/permission?
- [ ] **Check database**: Does data exist? Is it correct?
- [ ] **Check ID types**: Are IDs strings or ObjectIds? Comparing correctly?
- [ ] **Check timestamps**: Are dates valid? Not expired?
- [ ] **Check status**: Is resource in correct state for operation?
- [ ] **Check relationships**: Are references correct? Documents populated?
- [ ] **Check validation**: Do all required fields exist? Are values valid?
- [ ] **Check indexes**: Are queries using indexes? Are they created?
- [ ] **Check error logs**: What's the actual error message?
- [ ] **Check similar code**: How is this done elsewhere?
- [ ] **Check API contracts**: Are request/response formats correct?

---

## Getting Help

When you're stuck:

1. **Check this guide** for your symptom
2. **Review the main documentation** for how feature should work
3. **Check the code** - trace through actual implementation
4. **Check database** - query to see actual state
5. **Add logging** - understand what's happening
6. **Test manually** - use curl or Postman
7. **Ask teammates** - someone may have solved it before

---

## Common Debug Commands

```javascript
// Check team structure
const team = await ProductionTeam.findById(teamId).populate('owner').populate('members.user');
console.log(JSON.stringify(team, null, 2));

// Check all user's teams
const teams = await ProductionTeam.find({
  $or: [{ owner: userId }, { 'members.user': userId }]
});
console.log('User teams:', teams.length);

// Check project and castings
const project = await FilmProject.findById(projectId);
const castings = await CastingCall.find({ project: projectId });
console.log('Project:', project.name, 'Status:', project.status);
console.log('Castings:', castings.length);

// Check user permissions
const user = await User.findById(userId);
const team = await ProductionTeam.findById(teamId);
console.log('User role:', user.role);
console.log('Is owner:', String(team.owner) === String(userId));
console.log('Is member:', team.members.some(m => String(m.user) === String(userId)));

// Check invitation status
const inv = await TeamInvitation.findById(invitationId);
console.log('Status:', inv.status);
console.log('Expired:', inv.expiresAt < new Date());
console.log('Invitee:', inv.invitee);
```

---

This guide should help you solve 90% of common issues. For complex problems, trace through the code with logging and check the database state.
