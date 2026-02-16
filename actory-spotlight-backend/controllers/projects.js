const FilmProject = require('../models/FilmProject');
const ProductionTeam = require('../models/ProductionTeam');
const CastingCall = require('../models/CastingCall');
const { createNotification } = require('../utils/notificationService');

const isTeamMember = (team, userId) =>
  String(team.owner) === String(userId) || team.members.some((m) => String(m.user) === String(userId));

exports.deleteProject = async (req, res) => {
  try {
    const project = await FilmProject.findById(req.params.id).populate('team');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = String(project.createdBy) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
    }

    const team = project.team;
    if (!team) return res.status(400).json({ success: false, message: 'Project has no team' });

    // Delete related casting calls
    await CastingCall.deleteMany({ project: project._id });

    await project.deleteOne();

    // Notify team members about deletion (best-effort)
    try {
      await team.populate('owner');
      await team.populate('members.user');
      const notifyUsers = [team.owner?._id || team.owner, ...team.members.map((m) => m.user?._id || m.user)]
        .filter((id) => id && String(id) !== String(req.user._id));

      await Promise.all(
        notifyUsers.map((u) =>
          createNotification({
            user: u,
            title: 'Project deleted',
            message: `${project.name} was removed from team ${team.name}`,
            type: 'project',
            relatedId: project._id,
            relatedType: 'film-project'
          }).catch(() => null)
        )
      );
    } catch (_) {
      // non-blocking
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error', err);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { teamId, name, genre, language, location, startDate, endDate, description, roles } = req.body || {};
    if (!teamId || !name) {
      return res.status(400).json({ success: false, message: 'teamId and name are required' });
    }

    // Validate dates (optional fields)
    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd = endDate ? new Date(endDate) : undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate && (isNaN(parsedStart?.getTime()))) {
      return res.status(400).json({ success: false, message: 'Invalid startDate' });
    }

    if (endDate && (isNaN(parsedEnd?.getTime()))) {
      return res.status(400).json({ success: false, message: 'Invalid endDate' });
    }

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      return res.status(400).json({ success: false, message: 'endDate must be on or after startDate' });
    }

    if (parsedStart && parsedStart < today) {
      return res.status(400).json({ success: false, message: 'startDate cannot be in the past' });
    }

    if (parsedEnd && parsedEnd < today) {
      return res.status(400).json({ success: false, message: 'endDate cannot be in the past' });
    }

    // Fetch team WITHOUT populate first for membership check
    const team = await ProductionTeam.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isTeamMember(team, req.user._id)) {
      console.log('Authorization failed:', {
        userId: String(req.user._id),
        teamOwner: String(team.owner),
        teamMembers: team.members.map(m => String(m.user))
      });
      return res.status(403).json({ success: false, message: 'Not authorized for this team' });
    }

    const project = await FilmProject.create({
      team: team._id,
      name: name.trim(),
      genre: genre?.trim(),
      language: language?.trim(),
      location: location?.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      description: description?.trim(),
      createdBy: req.user._id,
      collaborators: [req.user._id],
      roles: roles || []
    });

    // Auto-generate casting calls for each role (non-blocking)
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // Run castings in background; don't block project creation response
      (async () => {
        try {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          
          const fourteenDaysFromNow = new Date();
          fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

          await Promise.all(
            roles.map(async (role, idx) => {
              try {
                // Build skills array (split comma strings, ensure at least one)
                const skillsArray = Array.isArray(role.skillsRequired)
                  ? role.skillsRequired
                  : String(role.skillsRequired || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                if (skillsArray.length === 0) skillsArray.push('Acting');

                // Date defaults that satisfy model validations
                // Ensure dates are at least submission < audition < shootStart < shootEnd
                const submissionDeadline = new Date();
                submissionDeadline.setDate(submissionDeadline.getDate() + 7);
                
                const auditionDate = new Date();
                auditionDate.setDate(auditionDate.getDate() + 14);
                
                // shootStartDate: use validated project startDate if present, otherwise auditionDate
                let shootStartDate = parsedStart && parsedStart >= auditionDate ? parsedStart : auditionDate;
                
                // shootEndDate: use validated project endDate if present, otherwise 7 days after shootStartDate
                let shootEndDate = parsedEnd && parsedEnd >= shootStartDate
                  ? parsedEnd
                  : new Date(shootStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

                // Age range defaults with guard
                const minAge = Number(role.ageMin) || 18;
                const maxAge = Number(role.ageMax) && Number(role.ageMax) >= minAge ? Number(role.ageMax) : Math.max(minAge, 60);

                const casting = await CastingCall.create({
                  roleTitle: role.roleName,
                  description: role.roleDescription || `Looking for a ${role.roleType} actor for ${project.name}`,
                  ageRange: { min: minAge, max: maxAge },
                  genderRequirement: (role.gender === 'Any' ? 'any' : role.gender?.toLowerCase()) || 'any',
                  experienceLevel: role.experienceLevel?.toLowerCase() || 'beginner',
                  location: project.location || location || 'TBD',
                  numberOfOpenings: Number(role.numberOfOpenings) || 1,
                  skills: skillsArray,
                  auditionDate,
                  submissionDeadline,
                  shootStartDate,
                  shootEndDate,
                  producer: req.user._id,
                  project: project._id,
                  projectRole: project.roles[idx]?._id,
                  team: team._id
                });
                // Update role with casting call ID
                if (project.roles[idx]) {
                  project.roles[idx].castingCallId = casting._id;
                }
              } catch (err) {
                console.error(`Failed to create casting for role ${role.roleName}:`, err.message);
              }
            })
          );
          // Save updated project with casting IDs
          await project.save().catch(err => console.error('Failed to save project with casting IDs:', err.message));
        } catch (err) {
          console.error('Background casting generation failed:', err.message);
        }
      })();
    }

    // Notify all team members about the new project (populate for notifications)
    await team.populate('owner');
    await team.populate('members.user');
    const notifyUsers = [team.owner?._id || team.owner, ...team.members.map((m) => m.user?._id || m.user)]
      .filter((id) => id && String(id) !== String(req.user._id)); // Filter out null/undefined IDs
    
    await Promise.all(
      notifyUsers.map((u) =>
        createNotification({
          user: u,
          title: 'New project created',
          message: `${project.name} was created in team ${team.name}`,
          type: 'project',
          relatedId: project._id,
          relatedType: 'film-project'
        }).catch(err => console.error(`Failed to notify user ${u}:`, err.message))
      )
    );

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error('createProject error', err);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, genre, language, location, startDate, endDate, description, status, roles } = req.body || {};
    const project = await FilmProject.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // Fetch team WITHOUT populate for membership check
    const team = await ProductionTeam.findById(project.team);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    if (name) project.name = name.trim();
    if (genre !== undefined) project.genre = genre?.trim();
    if (language !== undefined) project.language = language?.trim();
    if (location !== undefined) project.location = location?.trim();
    if (startDate) project.startDate = new Date(startDate);
    if (endDate) project.endDate = new Date(endDate);
    if (description !== undefined) project.description = description?.trim();
    if (status) project.status = status;
    if (roles) project.roles = roles;

    await project.save();

    // Notify team members about project update (populate for notifications, non-blocking)
    try {
      await team.populate('owner');
      await team.populate('members.user');
      const notifyUsers = [team.owner?._id || team.owner, ...team.members.map((m) => m.user?._id || m.user)].filter(
        (id) => id && String(id) !== String(req.user._id)
      );
      
      await Promise.all(
        notifyUsers.map((u) =>
          createNotification({
            user: u,
            title: 'Project updated',
            message: `${project.name} was updated`,
            type: 'project',
            relatedId: project._id,
            relatedType: 'film-project'
          }).catch(err => console.error(`Failed to notify user ${u}:`, err.message))
        )
      );
    } catch (err) {
      console.error('Notification error (non-blocking):', err.message);
    }

    res.json({ success: true, data: project });
  } catch (err) {
    console.error('updateProject error', err);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

exports.addRole = async (req, res) => {
  try {
    const { role } = req.body;
    const project = await FilmProject.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // Fetch team WITHOUT populate for membership check
    const team = await ProductionTeam.findById(project.team);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    if (!role || !role.roleName) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    // Basic validation for age range when provided
    const ageMinNum = role.ageMin ? Number(role.ageMin) : undefined;
    const ageMaxNum = role.ageMax ? Number(role.ageMax) : undefined;

    if (ageMinNum !== undefined && (!Number.isFinite(ageMinNum) || ageMinNum < 1 || ageMinNum > 120)) {
      return res.status(400).json({ success: false, message: 'ageMin must be a number between 1 and 120' });
    }

    if (ageMaxNum !== undefined && (!Number.isFinite(ageMaxNum) || ageMaxNum < 1 || ageMaxNum > 120)) {
      return res.status(400).json({ success: false, message: 'ageMax must be a number between 1 and 120' });
    }

    if (ageMinNum !== undefined && ageMaxNum !== undefined && ageMaxNum < ageMinNum) {
      return res.status(400).json({ success: false, message: 'ageMax must be greater than or equal to ageMin' });
    }

    // Create a new role object, only including fields that have values
    const newRole = {
      roleName: role.roleName,
      roleType: role.roleType || 'Supporting',
      gender: role.gender || 'Any',
      skillsRequired: Array.isArray(role.skillsRequired) ? role.skillsRequired : (role.skillsRequired ? [role.skillsRequired] : []),
      experienceLevel: role.experienceLevel || 'Beginner',
      numberOfOpenings: role.numberOfOpenings || 1
    };

    // Only add optional numeric fields if they're valid
    if (role.ageMin && Number.isFinite(Number(role.ageMin)) && Number(role.ageMin) >= 1 && Number(role.ageMin) <= 120) {
      newRole.ageMin = Number(role.ageMin);
    }
    if (role.ageMax && Number.isFinite(Number(role.ageMax)) && Number(role.ageMax) >= 1 && Number(role.ageMax) <= 120) {
      newRole.ageMax = Number(role.ageMax);
    }
    
    // Only add string fields if they have content
    if (role.physicalTraits && role.physicalTraits.trim()) {
      newRole.physicalTraits = role.physicalTraits.trim();
    }
    if (role.roleDescription && role.roleDescription.trim()) {
      newRole.roleDescription = role.roleDescription.trim();
    }

    project.roles.push(newRole);
    await project.save();

    // Get the newly added role (last one in the array)
    let addedRole = project.roles[project.roles.length - 1];

    // Auto-create a casting call for this role so it appears on the castings page
    try {
      const now = new Date();
      
      // Always use future dates for casting deadlines, even if project dates are in the past
      const defaultSubmission = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const defaultAudition = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      const ageMin = Number(addedRole.ageMin) || 18;
      const ageMax = Number(addedRole.ageMax) || Math.max(ageMin + 20, 25);

      // Ensure shoot dates are valid (must be on or after audition date)
      const shootStartDate = project.startDate && new Date(project.startDate) >= defaultAudition
        ? new Date(project.startDate)
        : defaultAudition;
      const shootEndDate = project.endDate && new Date(project.endDate) >= defaultAudition
        ? new Date(project.endDate)
        : new Date(defaultAudition.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after audition

      const castingCall = await CastingCall.create({
        roleTitle: addedRole.roleName,
        description: addedRole.roleDescription || `Casting for ${addedRole.roleName}`,
        ageRange: { min: ageMin, max: ageMax },
        genderRequirement: (addedRole.gender === 'Any' ? 'any' : addedRole.gender?.toLowerCase()) || 'any',
        experienceLevel: addedRole.experienceLevel?.toLowerCase() || 'beginner',
        location: project.location || 'TBD',
        numberOfOpenings: addedRole.numberOfOpenings || 1,
        skills: Array.isArray(addedRole.skillsRequired) ? addedRole.skillsRequired : [],
        auditionDate: defaultAudition,
        submissionDeadline: defaultSubmission,
        shootStartDate: shootStartDate,
        shootEndDate: shootEndDate,
        producer: req.user._id,
        project: project._id,
        projectRole: addedRole._id,
        team: team._id
      });

      // Link the role to the casting call and persist
      addedRole.castingCallId = castingCall._id;
      await project.save();
      
      // Reload the project to get the updated role with castingCallId
      await project.populate('roles');
      addedRole = project.roles.id(addedRole._id);
      
      console.log(`Casting call ${castingCall._id} created and linked to role ${addedRole._id}`);
    } catch (autoCastingErr) {
      console.error('Auto-create casting failed (role added ok):', autoCastingErr.message);
    }

    // Notify team members about new role (populate for notifications)
    try {
      await team.populate('owner');
      await team.populate('members.user');
      
      // Extract user IDs safely
      const notifyUsers = [];
      
      // Add owner if exists and not the current user
      if (team.owner) {
        const ownerId = typeof team.owner === 'string' ? team.owner : team.owner._id;
        if (ownerId && String(ownerId) !== String(req.user._id)) {
          notifyUsers.push(ownerId);
        }
      }
      
      // Add team members if exist and not the current user
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach((m) => {
          if (m.user) {
            const userId = typeof m.user === 'string' ? m.user : m.user._id;
            if (userId && String(userId) !== String(req.user._id)) {
              notifyUsers.push(userId);
            }
          }
        });
      }
      
      // Send notifications only if we have users to notify
      if (notifyUsers.length > 0) {
        await Promise.all(
          notifyUsers.map((userId) =>
            createNotification({
              user: userId,
              title: 'New role added to project',
              message: `New role "${role.roleName}" added to ${project.name}`,
              type: 'project',
              relatedId: project._id,
              relatedType: 'film-project'
            }).catch(err => console.error('Notification error:', err))
          )
        );
      }
    } catch (notifyErr) {
      console.error('Error sending notifications:', notifyErr);
      // Don't fail the entire request if notifications fail
    }

    // Reload project from database to ensure we have the latest state with castingCallId
    const updatedProject = await FilmProject.findById(project._id);
    
    res.json({ success: true, data: updatedProject });
  } catch (err) {
    console.error('addRole error', err);
    res.status(500).json({ success: false, message: 'Failed to add role', error: err.message });
  }
};

exports.createCastingFromRole = async (req, res) => {
  try {
    const { roleId, castingData } = req.body;
    const project = await FilmProject.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // Fetch team WITHOUT populate for membership check
    const team = await ProductionTeam.findById(project.team);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    const role = project.roles.id(roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    // Create casting call from role
    const castingCall = await CastingCall.create({
      roleTitle: role.roleName,
      description: castingData.description || role.roleDescription || `Looking for a ${role.roleType} actor`,
      ageRange: {
        min: role.ageMin || castingData.ageMin || 18,
        max: role.ageMax || castingData.ageMax || 60
      },
      heightRange: castingData.heightRange || {},
      genderRequirement: (role.gender === 'Any' ? 'any' : role.gender?.toLowerCase()) || 'any',
      experienceLevel: role.experienceLevel?.toLowerCase() || 'beginner',
      location: castingData.location || project.location || 'TBD',
      numberOfOpenings: role.numberOfOpenings || 1,
      skills: role.skillsRequired || castingData.skills || [],
      auditionDate: new Date(castingData.auditionDate),
      submissionDeadline: new Date(castingData.submissionDeadline),
      shootStartDate: new Date(castingData.shootStartDate || project.startDate),
      shootEndDate: new Date(castingData.shootEndDate || project.endDate),
      producer: req.user._id,
      project: project._id,
      projectRole: role._id,
      team: team._id
    });

    // Update role with casting call ID
    role.castingCallId = castingCall._id;
    await project.save();

    // Notify team members about new casting (populate for notifications)
    try {
      await team.populate('owner');
      await team.populate('members.user');
      
      // Extract user IDs safely
      const notifyUsers = [];
      
      // Add owner if exists and not the current user
      if (team.owner) {
        const ownerId = typeof team.owner === 'string' ? team.owner : team.owner._id;
        if (ownerId && String(ownerId) !== String(req.user._id)) {
          notifyUsers.push(ownerId);
        }
      }
      
      // Add team members if exist and not the current user
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach((m) => {
          if (m.user) {
            const userId = typeof m.user === 'string' ? m.user : m.user._id;
            if (userId && String(userId) !== String(req.user._id)) {
              notifyUsers.push(userId);
            }
          }
        });
      }
      
      // Send notifications only if we have users to notify
      if (notifyUsers.length > 0) {
        await Promise.all(
          notifyUsers.map((userId) =>
            createNotification({
              user: userId,
              title: 'New casting call posted',
              message: `Casting for "${role.roleName}" in ${project.name} is now open`,
              type: 'audition',
              relatedId: castingCall._id,
              relatedType: 'casting-call'
            }).catch(err => console.error('Notification error:', err))
          )
        );
      }
    } catch (notifyErr) {
      console.error('Error sending notifications:', notifyErr);
      // Don't fail the entire request if notifications fail
    }

    res.status(201).json({ success: true, data: castingCall });
  } catch (err) {
    console.error('createCastingFromRole error', err);
    res.status(500).json({ success: false, message: 'Failed to create casting from role' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { teamId } = req.query;

    // Find teams the user can access
    const accessibleTeams = await ProductionTeam.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).select('_id');

    const teamIds = accessibleTeams.map((t) => t._id.toString());

    if (teamId && !teamIds.includes(String(teamId))) {
      return res.status(403).json({ success: false, message: 'Not authorized for this team' });
    }

    const filter = teamId ? { team: teamId } : { team: { $in: teamIds } };

    const projects = await FilmProject.find(filter)
      .populate('team', 'name owner members')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: projects });
  } catch (err) {
    console.error('getProjects error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await FilmProject.findById(req.params.id)
      .populate('team', 'name owner members')
      .populate('createdBy', 'name email')
      .populate('collaborators', 'name email');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const team = project.team;

    const isActorViewer = !req.user || req.user.role === 'Actor';
    const isTeamMemberUser = Boolean(req.user && team && isTeamMember(team, req.user._id));

    if (isActorViewer) {
      // Allow actors to view active projects or any project that currently has a casting call
      const hasActiveCasting = await CastingCall.exists({ project: project._id });

      if (project.status === 'archived' || (!hasActiveCasting && project.status !== 'active')) {
        return res.status(403).json({ success: false, message: 'Project not available' });
      }
    } else {
      // Internal roles must belong to the team
      if (team && !isTeamMemberUser) {
        return res.status(403).json({ success: false, message: 'Not authorized for this project' });
      }
    }

    const projectData = project.toObject();
    projectData.viewerPermissions = {
      isTeamMember: isTeamMemberUser,
      canManageRoles:
        isTeamMemberUser && ['Producer', 'ProductionTeam', 'Admin'].includes(req.user?.role)
    };

    res.json({ success: true, data: projectData });
  } catch (err) {
    console.error('getProjectById error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};
