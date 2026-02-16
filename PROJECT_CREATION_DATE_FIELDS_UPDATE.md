# Project Creation Date Fields Update

## Summary
Successfully added all casting creation date fields to the project creation form with comprehensive validation matching the casting call form.

## Changes Made

### 1. **Added Required Date Fields**
The following date fields have been added to the project creation form (matching CastingCallForm):
- **Submission Deadline** - Date by which actors must submit auditions
- **Audition Date** - Date when auditions will be held
- **Shoot Start Date** - Date when filming begins
- **Shoot End Date** - Date when filming ends

### 2. **Form State Updates**

#### Before:
```javascript
submissionDeadline: '',
castingStartDate: '',
castingEndDate: '',
```

#### After:
```javascript
submissionDeadline: null,
auditionDate: null,
shootStartDate: null,
shootEndDate: null,
```

### 3. **Added Date Validation**

#### Validation Rules:
1. **Submission Deadline < Audition Date**
   - Error: "Submission deadline must be before audition date"
   
2. **Shoot Start Date > Audition Date**
   - Error: "Shoot start date must be after audition date"
   
3. **Shoot End Date >= Shoot Start Date**
   - Error: "Shoot end date must be on or after shoot start date"

#### Validation Function:
```javascript
const validateDates = (updatedForm) => {
  const errors = {};
  
  if (updatedForm.submissionDeadline && updatedForm.auditionDate) {
    if (updatedForm.submissionDeadline >= updatedForm.auditionDate) {
      errors.submissionDeadline = 'Submission deadline must be before audition date';
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
```

### 4. **Calendar Picker Implementation**

All date fields now use proper Calendar components with Popover instead of basic HTML date inputs:

#### Features:
- **Visual calendar picker** with month/year navigation
- **Disabled past dates** - Only future dates can be selected
- **Cross-field validation** - Dates are validated against each other in real-time
- **Clear error messages** - Red error text with alert icon shown below invalid fields
- **Formatted display** - Dates shown in readable format (e.g., "January 15, 2024")

#### Example Calendar Picker Structure:
```jsx
<Popover open={openDates.submissionDeadline} onOpenChange={...}>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {form.submissionDeadline ? format(form.submissionDeadline, "PPP") : "Pick a date"}
      <CalendarIcon />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      mode="single"
      selected={form.submissionDeadline}
      onSelect={(date) => handleFormChange('submissionDeadline', date)}
      disabled={(date) => {
        // Disable past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return true;
        
        // Disable dates on/after audition date
        if (form.auditionDate) {
          return date >= new Date(form.auditionDate);
        }
        return false;
      }}
    />
  </PopoverContent>
</Popover>
{dateErrors.submissionDeadline && (
  <p className="text-sm text-red-500 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    {dateErrors.submissionDeadline}
  </p>
)}
```

### 5. **Updated Imports**
Added `AlertCircle` icon from lucide-react for error display:
```javascript
import { CalendarIcon, AlertCircle } from 'lucide-react';
```

### 6. **Backend Payload Mapping**
Updated the project creation mutation to properly map all date fields:

```javascript
const payload = {
  // ... other fields
  startDate: form.shootStartDate,  // Changed from castingStartDate
  endDate: form.shootEndDate,      // Changed from castingEndDate
  meta: {
    // ... other fields
    submissionDeadline: form.submissionDeadline,
    auditionDate: form.auditionDate,
    shootStartDate: form.shootStartDate,
    shootEndDate: form.shootEndDate,
    // ... other fields
  },
};
```

## Visual Changes

### Before:
- Simple HTML `<input type="date">` fields
- No validation
- No visual feedback for errors
- Field labels: "Casting start", "Casting end"

### After:
- Full Calendar picker with Popover
- Real-time cross-field validation
- Red error messages with alert icons
- Field labels: "Submission Deadline *", "Audition Date *", "Shoot Start Date *", "Shoot End Date *"
- All four critical casting dates clearly visible

## Testing Instructions

1. **Navigate to Projects page** (http://localhost:8080/projects)
2. **Start creating a new project**
3. **Test date validation**:
   - Try setting Submission Deadline >= Audition Date → Should show error
   - Try setting Shoot Start Date <= Audition Date → Should show error
   - Try setting Shoot End Date < Shoot Start Date → Should show error
4. **Test calendar functionality**:
   - Click on each date field
   - Verify calendar popup appears
   - Verify past dates are disabled
   - Verify dependent date restrictions work
5. **Submit a valid project** with all dates properly set

## Related Files Modified
- [actory-spotlight-ui/src/pages/Projects.jsx](actory-spotlight-ui/src/pages/Projects.jsx)

## Backend Integration
- Backend already supports these fields via the `meta` object in project creation
- When roles are added to projects, the backend automatically creates casting calls using these dates
- Auto-created casting calls now use:
  - `submissionDeadline` from project (or default 7 days from now)
  - `auditionDate` from project (or default 14 days from now)
  - `shootStartDate` and `shootEndDate` from project

## Status
✅ **COMPLETE** - All date fields added with proper validation
✅ Frontend server running on http://localhost:8080/
✅ No compilation errors
✅ Ready for testing

## Next Steps
1. Test the form in the browser
2. Create a test project with all dates
3. Add a role to the project
4. Verify the role appears immediately on the castings page
