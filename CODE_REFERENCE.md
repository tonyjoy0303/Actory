# Code Reference Guide

## Quick API Usage Examples

### 1. Create Project with Roles

#### Frontend
```javascript
const createProject = async () => {
  const payload = {
    teamId: "team_123",
    name: "Summer Action Film",
    genre: "Action",
    language: "English",
    location: "Mumbai",
    startDate: "2024-06-01",
    endDate: "2024-08-01",
    description: "An action-packed thriller",
    roles: [] // Can be empty or pre-filled
  };
  
  const { data } = await API.post('/projects', payload);
  // Returns: { success: true, data: project }
};
```

#### Backend Response
```json
{
  "success": true,
  "data": {
    "_id": "proj_123",
    "team": "team_123",
    "name": "Summer Action Film",
    "genre": "Action",
    "language": "English",
    "roles": [],
    "status": "draft",
    "createdAt": "2024-01-22T10:00:00Z"
  }
}
```

### 2. Add Role to Project

#### Frontend
```javascript
const addRole = async (projectId, roleData) => {
  const rolePayload = {
    role: {
      roleName: "Lead Actor",
      roleType: "Lead",
      ageMin: 25,
      ageMax: 35,
      gender: "Male",
      physicalTraits: "Tall, athletic build",
      skillsRequired: ["Acting", "Martial Arts", "Sword Fighting"],
      experienceLevel: "Professional",
      roleDescription: "The main hero of the story",
      numberOfOpenings: 1
    }
  };
  
  const { data } = await API.post(`/projects/${projectId}/roles`, rolePayload);
  // Returns: { success: true, data: updatedProject }
};
```

#### Backend
```javascript
// controller/projects.js
exports.addRole = async (req, res) => {
  const { role } = req.body;
  const project = await FilmProject.findById(req.params.id).populate('team');
  
  project.roles.push(role);
  await project.save();
  
  // Notify team members
  const notifyUsers = [team.owner, ...team.members.map(m => m.user)];
  await Promise.all(notifyUsers.map(u => createNotification({...})));
  
  res.json({ success: true, data: project });
};
```

### 3. Create Casting from Role

#### Frontend
```javascript
const createCastingFromRole = async (projectId, roleId, castingData) => {
  const payload = {
    roleId: roleId,
    castingData: {
      description: "Looking for an experienced actor...",
      auditionDate: "2024-02-15T10:00:00",
      submissionDeadline: "2024-02-10T18:00:00",
      location: "Mumbai",
      skills: ["Acting", "Martial Arts"]
    }
  };
  
  const { data } = await API.post(
    `/projects/${projectId}/roles/${roleId}/casting`,
    payload
  );
  // Returns: { success: true, data: castingCall }
};
```

#### Backend
```javascript
// controller/projects.js
exports.createCastingFromRole = async (req, res) => {
  const { castingData } = req.body;
  const project = await FilmProject.findById(req.params.id);
  const role = project.roles.id(req.params.roleId);
  
  // Create casting with auto-filled requirements
  const castingCall = await CastingCall.create({
    roleTitle: role.roleName,
    description: castingData.description,
    ageRange: {
      min: role.ageMin,
      max: role.ageMax
    },
    genderRequirement: role.gender.toLowerCase(),
    experienceLevel: role.experienceLevel.toLowerCase(),
    skills: role.skillsRequired,
    numberOfOpenings: role.numberOfOpenings,
    auditionDate: new Date(castingData.auditionDate),
    submissionDeadline: new Date(castingData.submissionDeadline),
    location: castingData.location,
    producer: req.user._id,
    project: project._id,
    projectRole: role._id,
    team: project.team
  });
  
  // Update role with castingCallId
  role.castingCallId = castingCall._id;
  await project.save();
  
  // Notify team
  await createNotification({...});
  
  res.status(201).json({ success: true, data: castingCall });
};
```

### 4. Get Team Castings

#### Frontend
```javascript
const getTeamCastings = async (teamId) => {
  const { data } = await API.get(`/casting/team/${teamId}`);
  // Returns: { success: true, count: 5, data: [castingCalls] }
};
```

#### Backend
```javascript
// controller/casting.js
exports.getTeamCastingCalls = async (req, res) => {
  const { teamId } = req.params;
  
  // Verify user is team member
  const team = await ProductionTeam.findById(teamId);
  const isTeamMember = String(team.owner) === String(req.user.id) || 
    team.members.some(m => String(m.user) === String(req.user.id));
  
  if (!isTeamMember) {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized' 
    });
  }
  
  // Find all castings for this team
  const castingCalls = await CastingCall.find({ team: teamId })
    .populate('producer', 'name email')
    .populate('project', 'name description')
    .sort({ createdAt: -1 });
  
  res.json({ success: true, count: castingCalls.length, data: castingCalls });
};
```

### 5. View Casting with Project Info

#### Frontend
```javascript
const getCastingDetails = async (castingId) => {
  const { data } = await API.get(`/casting/${castingId}`);
  // Returns casting with project and producer populated
};
```

#### Response
```json
{
  "_id": "casting_123",
  "roleTitle": "Lead Actor",
  "producer": {
    "_id": "user_123",
    "name": "John Producer",
    "email": "john@production.com"
  },
  "project": {
    "_id": "proj_123",
    "name": "Summer Action Film",
    "description": "An action-packed thriller"
  },
  "team": "team_123",
  "ageRange": { "min": 25, "max": 35 },
  "genderRequirement": "male",
  "experienceLevel": "professional",
  "skills": ["Acting", "Martial Arts"],
  "auditionDate": "2024-02-15T10:00:00",
  "submissionDeadline": "2024-02-10T18:00:00"
}
```

### 6. Send Notification to Team

#### Backend
```javascript
// utils/notificationService.js
const { createNotification } = require('../utils/notificationService');

// When project is created
await createNotification({
  user: teamMemberId,
  title: 'New project created',
  message: `${project.name} was created in team ${team.name}`,
  type: 'project',
  relatedId: project._id,
  relatedType: 'film-project'
});

// When role is added
await createNotification({
  user: teamMemberId,
  title: 'New role added to project',
  message: `New role "${role.roleName}" added to ${project.name}`,
  type: 'role',
  relatedId: project._id,
  relatedType: 'film-project'
});

// When casting is created
await createNotification({
  user: teamMemberId,
  title: 'New casting call posted',
  message: `Casting for "${role.roleName}" in ${project.name} is now open`,
  type: 'casting',
  relatedId: castingCall._id,
  relatedType: 'casting-call'
});
```

---

## Component Examples

### ProjectDetails Component Usage

```javascript
// In your routing setup
<Route path="/projects/:id" element={<ProjectDetails />} />

// Component receives projectId from route params
const { projectId } = useParams();

// Query project details
const projectQuery = useQuery({
  queryKey: ['project', projectId],
  queryFn: async () => {
    const { data } = await API.get(`/projects/${projectId}`);
    return data.data;
  }
});

// Add role
const addRoleMutation = useMutation({
  mutationFn: async () => {
    const { data } = await API.post(`/projects/${projectId}/roles`, {
      role: roleForm
    });
    return data.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  }
});

// Create casting
const createCastingMutation = useMutation({
  mutationFn: async () => {
    const { data } = await API.post(
      `/projects/${projectId}/roles/${selectedRole._id}/casting`,
      { roleId: selectedRole._id, castingData: castingForm }
    );
    return data.data;
  }
});
```

### CastingList Component Updates

```javascript
// Fetch user's teams
const [userTeams, setUserTeams] = useState([]);

useEffect(() => {
  if (user && ['Producer', 'ProductionTeam'].includes(user.role)) {
    API.get('/teams').then(({ data }) => {
      setUserTeams(data.data || []);
    });
  }
}, [user]);

// Toggle team castings
const [showTeamCastings, setShowTeamCastings] = useState(false);

// Display team castings button
{userTeams.length > 0 && (
  <Button
    variant={showTeamCastings ? 'default' : 'outline'}
    onClick={() => setShowTeamCastings(!showTeamCastings)}
  >
    {showTeamCastings ? '✓ My Team Castings' : 'My Team Castings'}
  </Button>
)}

// Show casting with project name
<CardTitle className="text-xl">{casting.roleTitle}</CardTitle>
{casting.project && (
  <p className="text-sm text-muted-foreground">
    Project: <span className="font-medium">{casting.project.name}</span>
  </p>
)}
```

---

## Database Query Examples

### Find All Projects in a Team
```javascript
FilmProject.find({ team: teamId })
  .populate('team', 'name owner')
  .populate('createdBy', 'name email');
```

### Find All Roles in a Project
```javascript
const project = await FilmProject.findById(projectId);
const roles = project.roles; // Array of RoleSchema objects
```

### Find Casting by Project and Role
```javascript
const casting = await CastingCall.findOne({
  project: projectId,
  projectRole: roleId
}).populate('producer').populate('project');
```

### Get All Castings for a Team
```javascript
const castings = await CastingCall.find({ team: teamId })
  .populate('producer', 'name email')
  .populate('project', 'name description')
  .sort({ createdAt: -1 });
```

### Find Roles Without Castings
```javascript
const project = await FilmProject.findById(projectId);
const rolesWithoutCasting = project.roles.filter(role => !role.castingCallId);
```

### Get Notifications for User
```javascript
const notifications = await Notification.find({ 
  user: userId,
  isRead: false 
}).sort({ createdAt: -1 });
```

---

## Error Handling Examples

### Try-Catch Pattern
```javascript
try {
  const { data } = await API.post(`/projects/${projectId}/roles`, {
    role: roleForm
  });
  
  if (!data.success) {
    toast.error(data.message || 'Failed to add role');
    return;
  }
  
  toast.success('Role added successfully');
  // Update UI
  
} catch (err) {
  console.error('Error adding role:', err);
  const errorMsg = err.response?.data?.message || 'An error occurred';
  toast.error(errorMsg);
}
```

### Validation Errors
```javascript
// Role name required
if (!roleForm.roleName?.trim()) {
  toast.error('Role name is required');
  return;
}

// Age range validation
if (roleForm.ageMin && roleForm.ageMax) {
  if (roleForm.ageMin > roleForm.ageMax) {
    toast.error('Minimum age cannot be greater than maximum age');
    return;
  }
}

// Date validation
if (new Date(castingForm.submissionDeadline) >= new Date(castingForm.auditionDate)) {
  toast.error('Submission deadline must be before audition date');
  return;
}
```

---

## Useful Queries for Testing

```javascript
// MongoDB queries

// Check all projects
db.filmprojects.find().pretty()

// Check specific project with roles
db.filmprojects.findOne({ name: "Summer Action Film" })

// Check all castings with project info
db.castingcalls.find().populate('project').pretty()

// Check notifications
db.notifications.find({ type: "casting" }).pretty()

// Count castings by team
db.castingcalls.aggregate([
  { $group: { _id: "$team", count: { $sum: 1 } } }
])

// Find roles without castings
db.filmprojects.aggregate([
  { $unwind: "$roles" },
  { $match: { "roles.castingCallId": null } },
  { $project: { projectName: "$name", role: "$roles" } }
])
```

---

## Testing Helpers

```javascript
// Mock API responses
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock project response
const mockProject = {
  _id: 'proj_123',
  name: 'Test Project',
  team: 'team_123',
  roles: [
    {
      _id: 'role_123',
      roleName: 'Lead',
      ageMin: 25,
      ageMax: 35,
      castingCallId: 'casting_123'
    }
  ]
};

// Mock casting response
const mockCasting = {
  _id: 'casting_123',
  roleTitle: 'Lead',
  project: { _id: 'proj_123', name: 'Test Project' },
  producer: { name: 'John' },
  auditionDate: new Date(),
  submissionDeadline: new Date()
};
```

