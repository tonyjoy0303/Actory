import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const _jsxFileName = "";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import API from '@/lib/api';

const fetchProjects = async () => {
  const { data } = await API.get('/projects');
  if (!data.success) throw new Error('Failed to load projects');
  return data.data;
};

const fetchTeams = async () => {
  const { data } = await API.get('/teams');
  if (!data.success) throw new Error('Failed to load teams');
  return data.data;
};

export default function Projects() {
  const navigate = useNavigate();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();
  if (!user || !['Producer', 'ProductionTeam', 'ProductionHouse'].includes(user.role)) {
    console.log('Access Denied. User:', user);
    return React.createElement('div', { className: "container py-8 text-sm text-muted-foreground" }, "Access Denied: You must be a Producer or Production Team to manage projects.");
  }

  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const [form, setForm] = useState({
    projectTitle: '',
    projectType: '',
    genre: '',
    language: '',
    productionHouse: user?.companyName || '',
    synopsis: '',
    projectStatus: 'Planning',
    teamId: '',
    owner: (user?.role === 'ProductionTeam' ? user?.companyName : user?.name) || '',
    recruiters: '',
    permissions: '',
    castingCallType: 'Open',
    auditionMode: 'Self-tape',
    submissionDeadline: '',
    auditionInstructions: '',
    mediaRequirements: '',
    castingStartDate: '',
    castingEndDate: '',
    shootingSchedule: '',
    callbackDates: '',
    fileLinks: '',
    notifications: 'Project Created, New Role Added, Casting Call Published, Audition Submitted, Shortlisting Update'
  });

  const [roles, setRoles] = useState([]);
  const [roleDraft, setRoleDraft] = useState({
    roleName: '',
    roleType: 'Lead',
    ageMin: '',
    ageMax: '',
    gender: 'Any',
    physicalTraits: '',
    skillsRequired: '',
    experienceLevel: 'Beginner',
    roleDescription: ''
  });

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });

  const createProject = useMutation({
    mutationFn: async () => {
      const required = ['teamId', 'projectTitle', 'projectType', 'genre', 'language', 'productionHouse', 'synopsis', 'projectStatus'];
      const missing = required.filter((key) => !form[key]?.trim());
      if (missing.length) {
        throw new Error(`Please fill required fields: ${missing.join(', ')}`);
      }

      // Map UI fields to backend expectations
      const payload = {
        teamId: form.teamId,
        name: form.projectTitle,
        genre: form.genre,
        language: form.language,
        location: form.shootingSchedule || form.productionHouse,
        startDate: form.castingStartDate,
        endDate: form.castingEndDate,
        description: form.synopsis,
        // Keep extra data for potential future backend support
        roles,
        meta: {
          projectType: form.projectType,
          projectStatus: form.projectStatus,
          productionHouse: form.productionHouse,
          owner: form.owner,
          recruiters: form.recruiters,
          permissions: form.permissions,
          castingCallType: form.castingCallType,
          auditionMode: form.auditionMode,
          submissionDeadline: form.submissionDeadline,
          auditionInstructions: form.auditionInstructions,
          mediaRequirements: form.mediaRequirements,
          shootingSchedule: form.shootingSchedule,
          callbackDates: form.callbackDates,
          fileLinks: form.fileLinks,
          notifications: form.notifications,
        },
      };
      const { data } = await API.post('/projects', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Project created');
      setForm({
        projectTitle: '',
        projectType: '',
        genre: '',
        language: '',
        productionHouse: user?.companyName || '',
        synopsis: '',
        projectStatus: 'Planning',
        teamId: '',
        owner: (user?.role === 'ProductionTeam' ? user?.companyName : user?.name) || '',
        recruiters: '',
        permissions: '',
        castingCallType: 'Open',
        auditionMode: 'Self-tape',
        submissionDeadline: '',
        auditionInstructions: '',
        mediaRequirements: '',
        castingStartDate: '',
        castingEndDate: '',
        shootingSchedule: '',
        callbackDates: '',
        fileLinks: '',
        notifications: 'Project Created, New Role Added, Casting Call Published, Audition Submitted, Shortlisting Update'
      });
      setRoles([]);
      setRoleDraft({ roleName: '', roleType: 'Lead', ageMin: '', ageMax: '', gender: 'Any', physicalTraits: '', skillsRequired: '', experienceLevel: 'Beginner', roleDescription: '' });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      console.error(err);
      const apiMsg = err?.response?.data?.message;
      if (err?.response?.status === 403 && apiMsg === 'Not authorized for this team') {
        toast.error('You are not a member of the selected team. Choose a team you belong to or create a team first.');
      } else {
        toast.error(err.message || 'Failed to create project');
      }
    }
  });

  // Toast guidance when there are no teams
  useEffect(() => {
    if (!teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.length === 0) {
      toast.message('You need a team to create projects', {
        description: 'Create or join a Production Team to manage film projects.',
      });
    }
  }, [teamsQuery.isLoading, teamsQuery.data]);

  const addRole = () => {
    if (!roleDraft.roleName.trim()) {
      toast.error('Role name is required');
      return;
    }
    setRoles((prev) => [...prev, roleDraft]);
    setRoleDraft({ roleName: '', roleType: 'Lead', ageMin: '', ageMax: '', gender: 'Any', physicalTraits: '', skillsRequired: '', experienceLevel: 'Beginner', roleDescription: '' });
  };

  return (
    React.createElement('div', { className: "container py-8 space-y-6", __self: this, __source: { fileName: _jsxFileName, lineNumber: 35 } }
      , React.createElement(Card, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 36 } }
        , React.createElement(CardHeader, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 37 } }
          , React.createElement(CardTitle, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 38 } }, "Create Film Project")
        )
        , React.createElement(CardContent, { className: "space-y-6", __self: this, __source: { fileName: _jsxFileName, lineNumber: 40 } }
          , React.createElement('div', { className: "grid gap-3 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 41 } }
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 42 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 43 } }, "Project Title")
              , React.createElement(Input, { placeholder: "Project Title", value: form.projectTitle, onChange: (e) => setForm({ ...form, projectTitle: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 44 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 46 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 47 } }, "Project Type")
              , React.createElement(Select, { value: form.projectType, onValueChange: (v) => setForm({ ...form, projectType: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 48 } }
                , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 49 } }
                  , React.createElement(SelectValue, { placeholder: "Project Type", __self: this, __source: { fileName: _jsxFileName, lineNumber: 50 } })
                )
                , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 51 } }
                  , React.createElement(SelectItem, { value: "Feature Film", __self: this, __source: { fileName: _jsxFileName, lineNumber: 52 } }, "Feature Film")
                  , React.createElement(SelectItem, { value: "Short Film", __self: this, __source: { fileName: _jsxFileName, lineNumber: 53 } }, "Short Film")
                  , React.createElement(SelectItem, { value: "Web Series", __self: this, __source: { fileName: _jsxFileName, lineNumber: 54 } }, "Web Series")
                  , React.createElement(SelectItem, { value: "Ad", __self: this, __source: { fileName: _jsxFileName, lineNumber: 55 } }, "Ad")
                )
              )
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 57 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 58 } }, "Genre")
              , React.createElement(Input, { placeholder: "Genre", value: form.genre, onChange: (e) => setForm({ ...form, genre: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 59 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 61 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 62 } }, "Language")
              , React.createElement(Input, { placeholder: "Language", value: form.language, onChange: (e) => setForm({ ...form, language: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 63 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 65 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 66 } }, "Production House")
              , React.createElement(Input, { placeholder: "Production House", value: form.productionHouse, onChange: (e) => setForm({ ...form, productionHouse: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 67 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 69 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 70 } }, "Project Status")
              , React.createElement(Select, { value: form.projectStatus, onValueChange: (v) => setForm({ ...form, projectStatus: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 71 } }
                , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 72 } }
                  , React.createElement(SelectValue, { placeholder: "Project Status", __self: this, __source: { fileName: _jsxFileName, lineNumber: 73 } })
                )
                , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 74 } }
                  , React.createElement(SelectItem, { value: "Planning", __self: this, __source: { fileName: _jsxFileName, lineNumber: 75 } }, "Planning")
                  , React.createElement(SelectItem, { value: "Casting", __self: this, __source: { fileName: _jsxFileName, lineNumber: 76 } }, "Casting")
                  , React.createElement(SelectItem, { value: "Shooting", __self: this, __source: { fileName: _jsxFileName, lineNumber: 77 } }, "Shooting")
                  , React.createElement(SelectItem, { value: "Post-Production", __self: this, __source: { fileName: _jsxFileName, lineNumber: 78 } }, "Post-Production")
                )
              )
            )
            , React.createElement('div', { className: "space-y-1 md:col-span-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 80 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 81 } }, "Synopsis")
              , React.createElement(Textarea, { className: "md:col-span-2", placeholder: "Synopsis", value: form.synopsis, onChange: (e) => setForm({ ...form, synopsis: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 82 } })
            )
          )

          , React.createElement(Separator, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 66 } })

          , React.createElement('div', { className: "grid gap-3 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 67 } }
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 68 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 69 } }, "Team")
              , React.createElement(Select, { value: form.teamId, onValueChange: (v) => setForm({ ...form, teamId: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 70 } }
                , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 71 } }
                  , React.createElement(SelectValue, { placeholder: teamsQuery.isLoading ? 'Loading teams…' : 'Select team', __self: this, __source: { fileName: _jsxFileName, lineNumber: 72 } })
                )
                , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 73 } }
                  , !teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.length > 0
                    ? teamsQuery.data.map((t) => React.createElement(SelectItem, { key: t._id, value: t._id, __self: this, __source: { fileName: _jsxFileName, lineNumber: 75 } }, t.name || t._id))
                    : null
                )
              )
              , (!teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.length === 0) && React.createElement('div', { className: "text-xs text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 77 } },
                "You don't belong to any team yet.",
                React.createElement(Button, { variant: "link", className: "px-1", onClick: () => navigate('/teams'), __self: this, __source: { fileName: _jsxFileName, lineNumber: 78 } }, "Create a team")
              )
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 72 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 73 } }, "Owner")
              , React.createElement(Input, { placeholder: "Owner", value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 74 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 76 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 77 } }, "Recruiters (comma-separated)")
              , React.createElement(Input, { placeholder: "Recruiters (comma-separated)", value: form.recruiters, onChange: (e) => setForm({ ...form, recruiters: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 78 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 80 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 81 } }, "Permissions / access notes")
              , React.createElement(Input, { placeholder: "Permissions / access notes", value: form.permissions, onChange: (e) => setForm({ ...form, permissions: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 82 } })
            )
          )

          , React.createElement(Separator, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 73 } })

          , React.createElement('div', { className: "space-y-3", __self: this, __source: { fileName: _jsxFileName, lineNumber: 74 } }
            , React.createElement('div', { className: "grid gap-3 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 75 } }
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 76 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 77 } }, "Role Name")
                , React.createElement(Input, { placeholder: "Role Name", value: roleDraft.roleName, onChange: (e) => setRoleDraft({ ...roleDraft, roleName: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 78 } })
              )
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 80 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 81 } }, "Role Type")
                , React.createElement(Select, { value: roleDraft.roleType, onValueChange: (v) => setRoleDraft({ ...roleDraft, roleType: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 82 } }
                  , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 83 } }
                    , React.createElement(SelectValue, { placeholder: "Role Type", __self: this, __source: { fileName: _jsxFileName, lineNumber: 84 } })
                  )
                  , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 85 } }
                    , React.createElement(SelectItem, { value: "Lead", __self: this, __source: { fileName: _jsxFileName, lineNumber: 86 } }, "Lead")
                    , React.createElement(SelectItem, { value: "Supporting", __self: this, __source: { fileName: _jsxFileName, lineNumber: 87 } }, "Supporting")
                    , React.createElement(SelectItem, { value: "Cameo", __self: this, __source: { fileName: _jsxFileName, lineNumber: 88 } }, "Cameo")
                  )
                )
              )
              , React.createElement('div', { className: "grid grid-cols-2 gap-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 90 } }
                , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 91 } }
                  , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 92 } }, "Age Min")
                  , React.createElement(Input, { placeholder: "Age Min", value: roleDraft.ageMin, onChange: (e) => setRoleDraft({ ...roleDraft, ageMin: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 93 } })
                )
                , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 95 } }
                  , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 96 } }, "Age Max")
                  , React.createElement(Input, { placeholder: "Age Max", value: roleDraft.ageMax, onChange: (e) => setRoleDraft({ ...roleDraft, ageMax: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 97 } })
                )
              )
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 99 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 100 } }, "Gender")
                , React.createElement(Select, { value: roleDraft.gender, onValueChange: (v) => setRoleDraft({ ...roleDraft, gender: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 101 } }
                  , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 102 } }
                    , React.createElement(SelectValue, { placeholder: "Gender", __self: this, __source: { fileName: _jsxFileName, lineNumber: 103 } })
                  )
                  , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 104 } }
                    , React.createElement(SelectItem, { value: "Male", __self: this, __source: { fileName: _jsxFileName, lineNumber: 105 } }, "Male")
                    , React.createElement(SelectItem, { value: "Female", __self: this, __source: { fileName: _jsxFileName, lineNumber: 106 } }, "Female")
                    , React.createElement(SelectItem, { value: "Any", __self: this, __source: { fileName: _jsxFileName, lineNumber: 107 } }, "Any")
                  )
                )
              )
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 109 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 110 } }, "Physical traits (height, appearance)")
                , React.createElement(Input, { placeholder: "Physical traits (height, appearance)", value: roleDraft.physicalTraits, onChange: (e) => setRoleDraft({ ...roleDraft, physicalTraits: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 111 } })
              )
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 113 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 114 } }, "Skills required (dance, action, dialect)")
                , React.createElement(Input, { placeholder: "Skills required (dance, action, dialect)", value: roleDraft.skillsRequired, onChange: (e) => setRoleDraft({ ...roleDraft, skillsRequired: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 115 } })
              )
              , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 117 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 118 } }, "Experience Level")
                , React.createElement(Select, { value: roleDraft.experienceLevel, onValueChange: (v) => setRoleDraft({ ...roleDraft, experienceLevel: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 119 } }
                  , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 120 } }
                    , React.createElement(SelectValue, { placeholder: "Experience Level", __self: this, __source: { fileName: _jsxFileName, lineNumber: 121 } })
                  )
                  , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 122 } }
                    , React.createElement(SelectItem, { value: "Beginner", __self: this, __source: { fileName: _jsxFileName, lineNumber: 123 } }, "Beginner")
                    , React.createElement(SelectItem, { value: "Intermediate", __self: this, __source: { fileName: _jsxFileName, lineNumber: 124 } }, "Intermediate")
                    , React.createElement(SelectItem, { value: "Professional", __self: this, __source: { fileName: _jsxFileName, lineNumber: 125 } }, "Professional")
                  )
                )
              )
              , React.createElement('div', { className: "space-y-1 md:col-span-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 127 } }
                , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 128 } }, "Role description / character background")
                , React.createElement(Textarea, { className: "md:col-span-2", placeholder: "Role description / character background", value: roleDraft.roleDescription, onChange: (e) => setRoleDraft({ ...roleDraft, roleDescription: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 129 } })
              )
              , React.createElement(Button, { onClick: addRole, className: "md:col-span-2", variant: "secondary", __self: this, __source: { fileName: _jsxFileName, lineNumber: 131 } }, "Add Role")
            )
            , roles.length > 0 && React.createElement('div', { className: "space-y-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 109 } }
              , roles.map((r, idx) => (
                React.createElement('div', { key: idx, className: "rounded-md border p-3 text-sm flex flex-col gap-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 110 } }
                  , React.createElement('strong', { __self: this, __source: { fileName: _jsxFileName, lineNumber: 111 } }, `${r.roleName} (${r.roleType})`)
                  , React.createElement('span', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 112 } }, `${r.ageMin || '?'}-${r.ageMax || '?'} | ${r.gender}`)
                  , r.skillsRequired && React.createElement('span', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 113 } }, `Skills: ${r.skillsRequired}`)
                  , r.experienceLevel && React.createElement('span', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 114 } }, `Experience: ${r.experienceLevel}`)
                  , r.roleDescription && React.createElement('span', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 115 } }, r.roleDescription)
                )
              ))
            )
          )

          , React.createElement(Separator, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 117 } })

          , React.createElement('div', { className: "grid gap-3 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 118 } }
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 119 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 120 } }, "Casting Call Type")
              , React.createElement(Select, { value: form.castingCallType, onValueChange: (v) => setForm({ ...form, castingCallType: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 121 } }
                , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 122 } }
                  , React.createElement(SelectValue, { placeholder: "Casting Call Type", __self: this, __source: { fileName: _jsxFileName, lineNumber: 123 } })
                )
                , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 124 } }
                  , React.createElement(SelectItem, { value: "Open", __self: this, __source: { fileName: _jsxFileName, lineNumber: 125 } }, "Open")
                  , React.createElement(SelectItem, { value: "Private", __self: this, __source: { fileName: _jsxFileName, lineNumber: 126 } }, "Private")
                  , React.createElement(SelectItem, { value: "Callback", __self: this, __source: { fileName: _jsxFileName, lineNumber: 127 } }, "Callback")
                )
              )
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 129 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 130 } }, "Audition Mode")
              , React.createElement(Select, { value: form.auditionMode, onValueChange: (v) => setForm({ ...form, auditionMode: v }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 131 } }
                , React.createElement(SelectTrigger, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 132 } }
                  , React.createElement(SelectValue, { placeholder: "Audition Mode", __self: this, __source: { fileName: _jsxFileName, lineNumber: 133 } })
                )
                , React.createElement(SelectContent, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 134 } }
                  , React.createElement(SelectItem, { value: "Self-tape", __self: this, __source: { fileName: _jsxFileName, lineNumber: 135 } }, "Self-tape")
                  , React.createElement(SelectItem, { value: "Live", __self: this, __source: { fileName: _jsxFileName, lineNumber: 136 } }, "Live")
                )
              )
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 138 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 139 } }, "Submission deadline")
              , React.createElement(Input, { type: "date", value: form.submissionDeadline, onChange: (e) => setForm({ ...form, submissionDeadline: e.target.value }), placeholder: "Submission deadline", __self: this, __source: { fileName: _jsxFileName, lineNumber: 140 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 142 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 143 } }, "Media requirements")
              , React.createElement(Input, { placeholder: "Media requirements (video, headshot, resume)", value: form.mediaRequirements, onChange: (e) => setForm({ ...form, mediaRequirements: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 144 } })
            )
            , React.createElement('div', { className: "space-y-1 md:col-span-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 146 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 147 } }, "Audition instructions")
              , React.createElement(Textarea, { className: "md:col-span-2", placeholder: "Audition instructions (scene, dialogue, duration)", value: form.auditionInstructions, onChange: (e) => setForm({ ...form, auditionInstructions: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 148 } })
            )
          )

          , React.createElement(Separator, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 138 } })

          , React.createElement('div', { className: "grid gap-3 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 139 } }
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 140 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 141 } }, "Casting start")
              , React.createElement(Input, { type: "date", value: form.castingStartDate, onChange: (e) => setForm({ ...form, castingStartDate: e.target.value }), placeholder: "Casting start", __self: this, __source: { fileName: _jsxFileName, lineNumber: 142 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 144 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 145 } }, "Casting end")
              , React.createElement(Input, { type: "date", value: form.castingEndDate, onChange: (e) => setForm({ ...form, castingEndDate: e.target.value }), placeholder: "Casting end", __self: this, __source: { fileName: _jsxFileName, lineNumber: 146 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 148 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 149 } }, "Shooting schedule")
              , React.createElement(Input, { placeholder: "Shooting schedule", value: form.shootingSchedule, onChange: (e) => setForm({ ...form, shootingSchedule: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 150 } })
            )
            , React.createElement('div', { className: "space-y-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 152 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 153 } }, "Callback dates")
              , React.createElement(Input, { placeholder: "Callback dates", value: form.callbackDates, onChange: (e) => setForm({ ...form, callbackDates: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 154 } })
            )
            , React.createElement('div', { className: "space-y-1 md:col-span-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 156 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 157 } }, "File & media links")
              , React.createElement(Textarea, { className: "md:col-span-2", placeholder: "File & media links (scripts, references, storyboards, audition videos)", value: form.fileLinks, onChange: (e) => setForm({ ...form, fileLinks: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 158 } })
            )
            , React.createElement('div', { className: "space-y-1 md:col-span-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 160 } }
              , React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 161 } }, "Notification rules")
              , React.createElement(Textarea, { className: "md:col-span-2", placeholder: "Notification rules (who to notify for project created, role added, casting call published, submission updates)", value: form.notifications, onChange: (e) => setForm({ ...form, notifications: e.target.value }), __self: this, __source: { fileName: _jsxFileName, lineNumber: 162 } })
            )
          )

          , React.createElement(Button, { className: "w-full", onClick: () => createProject.mutate(), disabled: createProject.isPending || !form.teamId, __self: this, __source: { fileName: _jsxFileName, lineNumber: 147 } }, createProject.isPending ? 'Creating...' : 'Create Project')
        )
      )

      , React.createElement('div', { className: "grid gap-4 md:grid-cols-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 149 } }
        , projectsQuery.isLoading && React.createElement('p', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 150 } }, "Loading projects...")
        , !projectsQuery.isLoading && projectsQuery.data && projectsQuery.data.map((project) => (
          React.createElement(Card, { key: project._id, __self: this, __source: { fileName: _jsxFileName, lineNumber: 151 } }
            , React.createElement(CardHeader, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 152 } }
              , React.createElement(CardTitle, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 153 } }, project.projectTitle || project.name)
            )
            , React.createElement(CardContent, { className: "space-y-1 text-sm", __self: this, __source: { fileName: _jsxFileName, lineNumber: 155 } }
              , React.createElement('p', { className: "text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 156 } }, project.genre)
              , React.createElement('p', { __self: this, __source: { fileName: _jsxFileName, lineNumber: 157 } }, project.synopsis || project.description)
              , React.createElement('p', { className: "text-xs text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 158 } }, `Status: ${project.projectStatus || 'N/A'}`)
              , project.roles && project.roles.length > 0 && React.createElement('ul', { className: "list-disc pl-4 text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 159 } }
                , project.roles.map((r, idx) => React.createElement('li', { key: idx, __self: this, __source: { fileName: _jsxFileName, lineNumber: 160 } }, `${r.roleName} (${r.roleType})`))
              )
            )
          )
        ))
      )
    )
  );
}
