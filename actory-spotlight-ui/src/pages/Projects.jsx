import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
    return <div className="container py-8 text-sm text-muted-foreground">Access Denied: You must be a Producer or Production Team to manage projects.</div>;
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
    submissionDeadline: null,
    auditionDate: null,
    shootStartDate: null,
    shootEndDate: null,
    auditionInstructions: '',
    mediaRequirements: '',
    shootingSchedule: '',
    callbackDates: '',
    fileLinks: '',
    notifications: 'Project Created, New Role Added, Casting Call Published, Audition Submitted, Shortlisting Update'
  });

  const [dateErrors, setDateErrors] = useState({});
  const [openDates, setOpenDates] = useState({
    submissionDeadline: false,
    auditionDate: false,
    shootStartDate: false,
    shootEndDate: false
  });

  // Date validation function
  const validateDates = (updatedForm) => {
    const errors = {};
    
    if (updatedForm.submissionDeadline && updatedForm.auditionDate) {
      if (updatedForm.submissionDeadline >= updatedForm.auditionDate) {
        errors.submissionDeadline = 'Submission deadline must be before audition date';
        errors.auditionDate = 'Audition date must be after submission deadline';
      }
    }
    
    if (updatedForm.shootStartDate && updatedForm.auditionDate) {
      if (updatedForm.shootStartDate <= updatedForm.auditionDate) {
        errors.shootStartDate = 'Shoot start date must be after audition date';
      }
    }
    
    if (updatedForm.shootEndDate && updatedForm.shootStartDate) {
      if (updatedForm.shootEndDate < updatedForm.shootStartDate) {
        errors.shootEndDate = 'Shoot end date must be on or after shoot start date';
      }
    }
    
    setDateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form changes with validation
  const handleFormChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    validateDates(updatedForm);
  };

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
      const missing = required.filter((key) => !form[key]?.trim?.() && !form[key]);
      if (missing.length) {
        throw new Error(`Please fill required fields: ${missing.join(', ')}`);
      }

      // Validate dates before submission
      if (!validateDates(form)) {
        throw new Error('Please fix date validation errors');
      }

      // Map UI fields to backend expectations
      const payload = {
        teamId: form.teamId,
        name: form.projectTitle,
        genre: form.genre,
        language: form.language,
        location: form.shootingSchedule || form.productionHouse,
        startDate: form.shootStartDate,
        endDate: form.shootEndDate,
        description: form.synopsis,
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
          auditionDate: form.auditionDate,
          shootStartDate: form.shootStartDate,
          shootEndDate: form.shootEndDate,
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
        submissionDeadline: null,
        auditionDate: null,
        shootStartDate: null,
        shootEndDate: null,
        auditionInstructions: '',
        mediaRequirements: '',
        shootingSchedule: '',
        callbackDates: '',
        fileLinks: '',
        notifications: 'Project Created, New Role Added, Casting Call Published, Audition Submitted, Shortlisting Update'
      });
      setDateErrors({});
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
    <div className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Film Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Project Information */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Project Title</label>
              <Input placeholder="Project Title" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Project Type</label>
              <Select value={form.projectType} onValueChange={(v) => setForm({ ...form, projectType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feature Film">Feature Film</SelectItem>
                  <SelectItem value="Short Film">Short Film</SelectItem>
                  <SelectItem value="Web Series">Web Series</SelectItem>
                  <SelectItem value="Ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Genre</label>
              <Input placeholder="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Language</label>
              <Input placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Production House</label>
              <Input placeholder="Production House" value={form.productionHouse} onChange={(e) => setForm({ ...form, productionHouse: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Project Status</label>
              <Select value={form.projectStatus} onValueChange={(v) => setForm({ ...form, projectStatus: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Project Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Casting">Casting</SelectItem>
                  <SelectItem value="Shooting">Shooting</SelectItem>
                  <SelectItem value="Post-Production">Post-Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Synopsis</label>
              <Textarea className="md:col-span-2" placeholder="Synopsis" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} />
            </div>
          </div>

          <Separator />

          {/* Team and Admin Information */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Team</label>
              <Select value={form.teamId} onValueChange={(v) => setForm({ ...form, teamId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={teamsQuery.isLoading ? 'Loading teams…' : 'Select team'} />
                </SelectTrigger>
                <SelectContent>
                  {!teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.length > 0
                    ? teamsQuery.data.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name || t._id}
                      </SelectItem>
                    ))
                    : null}
                </SelectContent>
              </Select>
              {!teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  You don't belong to any team yet.
                  <Button variant="link" className="px-1" onClick={() => navigate('/teams')}>
                    Create a team
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Owner</label>
              <Input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Recruiters (comma-separated)</label>
              <Input placeholder="Recruiters (comma-separated)" value={form.recruiters} onChange={(e) => setForm({ ...form, recruiters: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Permissions / access notes</label>
              <Input placeholder="Permissions / access notes" value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} />
            </div>
          </div>

          <Separator />

          {/* Role Management Section */}
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Role Name</label>
                <Input placeholder="Role Name" value={roleDraft.roleName} onChange={(e) => setRoleDraft({ ...roleDraft, roleName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Role Type</label>
                <Select value={roleDraft.roleType} onValueChange={(v) => setRoleDraft({ ...roleDraft, roleType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Supporting">Supporting</SelectItem>
                    <SelectItem value="Cameo">Cameo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Age Min</label>
                  <Input placeholder="Age Min" value={roleDraft.ageMin} onChange={(e) => setRoleDraft({ ...roleDraft, ageMin: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Age Max</label>
                  <Input placeholder="Age Max" value={roleDraft.ageMax} onChange={(e) => setRoleDraft({ ...roleDraft, ageMax: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Gender</label>
                <Select value={roleDraft.gender} onValueChange={(v) => setRoleDraft({ ...roleDraft, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Physical traits (height, appearance)</label>
                <Input placeholder="Physical traits (height, appearance)" value={roleDraft.physicalTraits} onChange={(e) => setRoleDraft({ ...roleDraft, physicalTraits: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Skills required (dance, action, dialect)</label>
                <Input placeholder="Skills required (dance, action, dialect)" value={roleDraft.skillsRequired} onChange={(e) => setRoleDraft({ ...roleDraft, skillsRequired: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Experience Level</label>
                <Select value={roleDraft.experienceLevel} onValueChange={(v) => setRoleDraft({ ...roleDraft, experienceLevel: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Experience Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Role description / character background</label>
                <Textarea className="md:col-span-2" placeholder="Role description / character background" value={roleDraft.roleDescription} onChange={(e) => setRoleDraft({ ...roleDraft, roleDescription: e.target.value })} />
              </div>
              <Button onClick={addRole} className="md:col-span-2" variant="secondary">
                Add Role
              </Button>
            </div>
            {roles.length > 0 && (
              <div className="space-y-2">
                {roles.map((r, idx) => (
                  <div key={idx} className="rounded-md border p-3 text-sm flex flex-col gap-1">
                    <strong>{r.roleName} ({r.roleType})</strong>
                    <span className="text-muted-foreground">{r.ageMin || '?'}-{r.ageMax || '?'} | {r.gender}</span>
                    {r.skillsRequired && <span className="text-muted-foreground">Skills: {r.skillsRequired}</span>}
                    {r.experienceLevel && <span className="text-muted-foreground">Experience: {r.experienceLevel}</span>}
                    {r.roleDescription && <span className="text-muted-foreground">{r.roleDescription}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Casting Call Information */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Casting Call Type</label>
              <Select value={form.castingCallType} onValueChange={(v) => setForm({ ...form, castingCallType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Casting Call Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Callback">Callback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Audition Mode</label>
              <Select value={form.auditionMode} onValueChange={(v) => setForm({ ...form, auditionMode: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Audition Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Self-tape">Self-tape</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Fields with Calendar Pickers */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Submission Deadline *</label>
              <Popover open={openDates.submissionDeadline} onOpenChange={(open) => setOpenDates({ ...openDates, submissionDeadline: open })}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.submissionDeadline && "text-muted-foreground")}>
                    {form.submissionDeadline ? format(form.submissionDeadline, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.submissionDeadline}
                    onSelect={(date) => {
                      handleFormChange('submissionDeadline', date);
                      setOpenDates({ ...openDates, submissionDeadline: false });
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (form.auditionDate) {
                        const audition = new Date(form.auditionDate);
                        audition.setHours(0, 0, 0, 0);
                        return date >= audition;
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.submissionDeadline && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {dateErrors.submissionDeadline}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Audition Date *</label>
              <Popover open={openDates.auditionDate} onOpenChange={(open) => setOpenDates({ ...openDates, auditionDate: open })}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.auditionDate && "text-muted-foreground")}>
                    {form.auditionDate ? format(form.auditionDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.auditionDate}
                    onSelect={(date) => {
                      handleFormChange('auditionDate', date);
                      setOpenDates({ ...openDates, auditionDate: false });
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.auditionDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {dateErrors.auditionDate}
                </p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Audition instructions</label>
              <Textarea className="md:col-span-2" placeholder="Audition instructions (scene, dialogue, duration)" value={form.auditionInstructions} onChange={(e) => setForm({ ...form, auditionInstructions: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Media requirements</label>
              <Input placeholder="Media requirements (video, headshot, resume)" value={form.mediaRequirements} onChange={(e) => setForm({ ...form, mediaRequirements: e.target.value })} />
            </div>
          </div>

          <Separator />

          {/* Shoot Schedule Information */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Shoot Start Date *</label>
              <Popover open={openDates.shootStartDate} onOpenChange={(open) => setOpenDates({ ...openDates, shootStartDate: open })}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.shootStartDate && "text-muted-foreground")}>
                    {form.shootStartDate ? format(form.shootStartDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.shootStartDate}
                    onSelect={(date) => {
                      handleFormChange('shootStartDate', date);
                      setOpenDates({ ...openDates, shootStartDate: false });
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (form.auditionDate) {
                        const audition = new Date(form.auditionDate);
                        audition.setHours(0, 0, 0, 0);
                        return date <= audition;
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.shootStartDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {dateErrors.shootStartDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Shoot End Date *</label>
              <Popover open={openDates.shootEndDate} onOpenChange={(open) => setOpenDates({ ...openDates, shootEndDate: open })}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.shootEndDate && "text-muted-foreground")}>
                    {form.shootEndDate ? format(form.shootEndDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.shootEndDate}
                    onSelect={(date) => {
                      handleFormChange('shootEndDate', date);
                      setOpenDates({ ...openDates, shootEndDate: false });
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (form.shootStartDate && date < new Date(form.shootStartDate)) return true;
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.shootEndDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {dateErrors.shootEndDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Shooting schedule</label>
              <Input placeholder="Shooting schedule" value={form.shootingSchedule} onChange={(e) => setForm({ ...form, shootingSchedule: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Callback dates</label>
              <Input placeholder="Callback dates" value={form.callbackDates} onChange={(e) => setForm({ ...form, callbackDates: e.target.value })} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">File & media links</label>
              <Textarea className="md:col-span-2" placeholder="File & media links (scripts, references, storyboards, audition videos)" value={form.fileLinks} onChange={(e) => setForm({ ...form, fileLinks: e.target.value })} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Notification rules</label>
              <Textarea className="md:col-span-2" placeholder="Notification rules (who to notify for project created, role added, casting call published, submission updates)" value={form.notifications} onChange={(e) => setForm({ ...form, notifications: e.target.value })} />
            </div>
          </div>

          <Button className="w-full" onClick={() => createProject.mutate()} disabled={createProject.isPending || !form.teamId}>
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="grid gap-4 md:grid-cols-2">
        {projectsQuery.isLoading && <p className="text-muted-foreground">Loading projects...</p>}
        {!projectsQuery.isLoading && projectsQuery.data && projectsQuery.data.map((project) => (
          <Card key={project._id}>
            <CardHeader>
              <CardTitle>{project.projectTitle || project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">{project.genre}</p>
              <p>{project.synopsis || project.description}</p>
              <p className="text-xs text-muted-foreground">Status: {project.projectStatus || 'N/A'}</p>
              {project.roles && project.roles.length > 0 && (
                <ul className="list-disc pl-4 text-muted-foreground">
                  {project.roles.map((r, idx) => (
                    <li key={idx}>{r.roleName} ({r.roleType})</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
