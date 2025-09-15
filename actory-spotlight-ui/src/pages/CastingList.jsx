import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users, Award, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import API from '@/lib/api';
import SEO from '@/components/SEO';

const ExperienceLevelBadge = ({ level }) => {
  const getVariant = () => {
    switch (level) {
      case 'beginner': return 'outline';
      case 'intermediate': return 'default';
      case 'professional': return 'secondary';
      default: return 'outline';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'professional': return 'Professional';
      default: return level;
    }
  };

  return (
    <Badge variant={getVariant()} className="text-xs">
      <Award className="w-3 h-3 mr-1" />
      {getLabel()}
    </Badge>
  );
};

export default function CastingList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [castings, setCastings] = useState([]);
  const [filters, setFilters] = useState({
    experienceLevel: '',
    genderRequirement: '',
    location: ''
  });

  useEffect(() => {
    const fetchCastings = async () => {
      try {
        const { data } = await API.get('/casting');
        // Sort by submission deadline (closest first)
        const sortedCastings = data.data.sort((a, b) => 
          new Date(a.submissionDeadline) - new Date(b.submissionDeadline)
        );
        setCastings(sortedCastings);
      } catch (err) {
        console.error('Failed to fetch casting calls', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCastings();
  }, []);

  const filtered = useMemo(() => {
    return castings.filter((c) => {
      const matchesSearch = [
        c.roleTitle?.toLowerCase(),
        c.location?.toLowerCase(),
        c.description?.toLowerCase(),
        ...(c.skills?.map(s => s.toLowerCase()) || [])
      ].some(field => field?.includes(query.toLowerCase()));

      const matchesFilters = (
        (!filters.experienceLevel || c.experienceLevel === filters.experienceLevel) &&
        (!filters.genderRequirement || c.genderRequirement === filters.genderRequirement) &&
        (!filters.location || c.location?.toLowerCase().includes(filters.location.toLowerCase()))
      );

      return matchesSearch && matchesFilters;
    });
  }, [castings, query, filters]);

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const isSubmissionOpen = (submissionDeadline) => {
    return isAfter(parseISO(submissionDeadline), new Date());
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <SEO 
        title="Casting Calls - Actory" 
        description="Browse and apply to the latest casting calls from top producers."
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Casting Calls</h1>
        <p className="text-muted-foreground">
          Find your next acting opportunity from our curated list of casting calls.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-2xl">
          <Input
            placeholder="Search by role, location, skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filters.experienceLevel}
            onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">All Experience Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="professional">Professional</option>
          </select>

          <select
            value={filters.genderRequirement}
            onChange={(e) => setFilters({...filters, genderRequirement: e.target.value})}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="any">Any</option>
            <option value="other">Other</option>
          </select>

          <Input
            placeholder="Filter by location"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            className="h-9 w-auto max-w-[200px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No casting calls found</h3>
          <p className="text-muted-foreground mt-2">
            {query || Object.values(filters).some(Boolean) 
              ? 'Try adjusting your search or filters.' 
              : 'Check back later for new opportunities.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((casting) => (
            <Card key={casting._id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{casting.roleTitle}</CardTitle>
                  <ExperienceLevelBadge level={casting.experienceLevel} />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {casting.location}
                </div>
                {!isSubmissionOpen(casting.submissionDeadline) && (
                  <Badge variant="destructive" className="mt-2 w-fit">
                    Submission Closed
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {casting.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Gender:</span>
                    <span className="ml-1 capitalize">{casting.genderRequirement}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Age Range:</span>
                    <span className="ml-1">
                      {casting.ageRange?.min} - {casting.ageRange?.max} years
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Audition:</span>
                    <span className="ml-1">{formatDate(casting.auditionDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Shoot:</span>
                    <span className="ml-1">
                      {formatDate(casting.shootStartDate)} - {formatDate(casting.shootEndDate)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Apply by:</span>
                    <span className={`ml-1 ${!isSubmissionOpen(casting.submissionDeadline) ? 'text-destructive' : ''}`}>
                      {formatDate(casting.submissionDeadline)}
                    </span>
                  </div>
                </div>

                {casting.skills?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-1">Skills Required:</div>
                    <div className="flex flex-wrap gap-1">
                      {casting.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    console.log('View Details clicked for casting ID:', casting._id);
                    console.log('Type of ID:', typeof casting._id);
                    console.log('Full casting object:', casting);
                    navigate(`/casting/${casting._id}`);
                  }}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
