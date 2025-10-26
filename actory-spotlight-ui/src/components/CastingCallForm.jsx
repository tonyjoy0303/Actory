import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Define form schema using Zod
const formSchema = z.object({
  roleTitle: z.string().min(2, { message: 'Role title must be at least 2 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  ageRange: z.object({
    min: z.number().min(1, { message: 'Minimum age must be at least 1' })
      .max(120, { message: 'Maximum age is 120' }),
    max: z.number().min(1, { message: 'Maximum age must be at least 1' })
      .max(120, { message: 'Maximum age is 120' })
  }).refine(data => data.max >= data.min, {
    message: 'Maximum age must be greater than or equal to minimum age',
    path: ['max']
  }),
  // Optional height requirement (cm)
  heightRange: z.object({
    min: z.number().min(50, { message: 'Minimum height must be at least 50 cm' }).max(300, { message: 'Maximum height is 300 cm' }).optional(),
    max: z.number().min(50, { message: 'Maximum height must be at least 50 cm' }).max(300, { message: 'Maximum height is 300 cm' }).optional(),
  }).refine(data => {
    const hasMin = typeof data.min === 'number';
    const hasMax = typeof data.max === 'number';
    if (hasMin && hasMax) return data.max >= data.min;
    return true;
  }, {
    message: 'Maximum height must be greater than or equal to minimum height',
    path: ['max']
  }),
  genderRequirement: z.enum(['male', 'female', 'any', 'other'], {
    required_error: 'Please select a gender requirement',
  }),
  experienceLevel: z.enum(['beginner', 'intermediate', 'professional'], {
    required_error: 'Please select an experience level',
  }),
  location: z.string().min(2, { message: 'Location is required' }),
  numberOfOpenings: z.number().min(1, { message: 'At least 1 opening is required' }),
  skills: z.array(z.string().min(1, { message: 'Skill cannot be empty' })).min(1, { message: 'At least one skill is required' }),
  auditionDate: z.date({
    required_error: 'Please select an audition date',
  }),
  submissionDeadline: z.date({
    required_error: 'Please select a submission deadline',
  }),
  shootStartDate: z.date({
    required_error: 'Please select a shoot start date',
  }),
  shootEndDate: z.date({
    required_error: 'Please select a shoot end date',
  }),
}).refine(data => data.submissionDeadline < data.auditionDate, {
  message: 'Submission deadline must be before the audition date',
  path: ['submissionDeadline']
}).refine(data => data.shootStartDate > data.auditionDate, {
  message: 'Shoot start date must be after the audition date',
  path: ['shootStartDate']
}).refine(data => data.shootEndDate >= data.shootStartDate, {
  message: 'Shoot end date must be on or after the shoot start date',
  path: ['shootEndDate']
});

export default function CastingCallForm({ castingCall, onSubmit, isSubmitting }) {
  const [skillInput, setSkillInput] = useState('');
  const [auditionDateOpen, setAuditionDateOpen] = useState(false);
  const [submissionDeadlineOpen, setSubmissionDeadlineOpen] = useState(false);
  const [shootStartDateOpen, setShootStartDateOpen] = useState(false);
  const [shootEndDateOpen, setShootEndDateOpen] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: castingCall || {
      roleTitle: '',
      description: '',
      ageRange: { min: 18, max: 60 },
      heightRange: { min: undefined, max: undefined },
      genderRequirement: 'any',
      experienceLevel: 'beginner',
      location: '',
      numberOfOpenings: 1,
      skills: [],
      auditionDate: new Date(),
      submissionDeadline: new Date(),
      shootStartDate: new Date(),
      shootEndDate: new Date(),
    },
  });

  const { watch, setValue } = form;
  const skills = watch('skills');
  const auditionDate = watch('auditionDate');
  const shootStartDate = watch('shootStartDate');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setValue('skills', [...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setValue('skills', skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Title */}
          <FormField
            control={form.control}
            name="roleTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Lead Actor, Supporting Role" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., New York, NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Age Range */}
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Range *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="Min"
                      value={field.value?.min ?? ''}
                      onChange={(e) => field.onChange({
                        ...field.value,
                        min: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                    />
                  </FormControl>
                  <span className="flex items-center">to</span>
                  <FormControl>
                    <Input
                      type="number"
                      min={field.value?.min || 1}
                      max={120}
                      placeholder="Max"
                      value={field.value?.max ?? ''}
                      onChange={(e) => field.onChange({
                        ...field.value,
                        max: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Height Range (optional, cm) */}
          <FormField
            control={form.control}
            name="heightRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height Range (cm)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      max={300}
                      placeholder="Min"
                      value={field.value?.min ?? ''}
                      onChange={(e) => field.onChange({
                        ...field.value,
                        min: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                    />
                  </FormControl>
                  <span className="flex items-center">to</span>
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      max={300}
                      placeholder="Max"
                      value={field.value?.max ?? ''}
                      onChange={(e) => field.onChange({
                        ...field.value,
                        max: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional. Leave blank if no specific height is required.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gender Requirement */}
          <FormField
            control={form.control}
            name="genderRequirement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender Requirement *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender requirement" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Experience Level */}
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Number of Openings */}
          <FormField
            control={form.control}
            name="numberOfOpenings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Openings *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Audition Date */}
          <FormField
            control={form.control}
            name="auditionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Audition Date *</FormLabel>
                <Popover open={auditionDateOpen} onOpenChange={setAuditionDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setAuditionDateOpen(false);
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submission Deadline */}
          <FormField
            control={form.control}
            name="submissionDeadline"
            render={({ field }) => {
              const auditionDate = form.watch('auditionDate');
              
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Submission Deadline *</FormLabel>
                  <Popover open={submissionDeadlineOpen} onOpenChange={setSubmissionDeadlineOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setSubmissionDeadlineOpen(false);
                        }}
                        disabled={(date) => {
                          // Allow today and future dates
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // If audition date is set, don't allow dates after it
                          if (auditionDate) {
                            const audition = new Date(auditionDate);
                            audition.setHours(0, 0, 0, 0);
                            return date < today || date >= audition;
                          }
                          
                          // Otherwise just block past dates
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Shoot Start Date */}
          <FormField
            control={form.control}
            name="shootStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Shoot Start Date *</FormLabel>
                <Popover open={shootStartDateOpen} onOpenChange={setShootStartDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setShootStartDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        // Allow today and future dates, but after audition date if set
                        if (date < today) return true;
                        if (auditionDate) {
                          const audition = new Date(auditionDate);
                          audition.setHours(0, 0, 0, 0);
                          return date <= audition;
                        }
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shoot End Date */}
          <FormField
            control={form.control}
            name="shootEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Shoot End Date *</FormLabel>
                <Popover open={shootEndDateOpen} onOpenChange={setShootEndDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setShootEndDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        // Allow today and future dates, but after shoot start date if set
                        if (date < today) return true;
                        if (shootStartDate && date < new Date(shootStartDate)) return true;
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the role, character details, and any specific requirements..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Skills */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills *</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Dancing, Martial Arts)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddSkill}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="px-6 py-2" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {castingCall ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              castingCall ? 'Update Casting Call' : 'Create Casting Call'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
