import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users, Award, CalendarCheck, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import API from '@/lib/api';
import ErrorBoundary from '@/components/ErrorBoundary';

function CastingDetailsContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [casting, setCasting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCastingDetails = async () => {
      try {
        console.log('Fetching casting details for ID:', id);
        const response = await API.get(`/casting/${id}`);
        
        console.log('API Response:', response);
        
        if (response.data && response.data.success) {
          setCasting(response.data.data);
        } else {
          console.error('Invalid response format:', response.data);
          throw new Error(response.data?.message || 'Invalid response format');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching casting details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });
        
        let errorMessage = 'Failed to load casting details';
        if (err.response?.status === 404) {
          if (err.response.data?.message === 'Casting call not found') {
            errorMessage = 'Casting call not found';
          } else if (err.response.data?.message === 'Casting call has expired') {
            errorMessage = 'Casting call has expired';
          } else {
            errorMessage = 'Casting call not found or may have expired';
          }
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }
    };

    fetchCastingDetails();
  }, [id, toast]);

  // Add a helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Format date range safely
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Not specified';
    try {
      return `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Invalid date range';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !casting) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>{error || 'Casting call not found'}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{casting.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{casting.productionCompany}</p>
            </div>
            <Badge variant={new Date(casting.submissionDeadline || casting.deadline) < new Date() ? 'destructive' : 'default'}>
              {new Date(casting.submissionDeadline || casting.deadline) < new Date() ? 'Closed' : 'Open'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {casting.location || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Gender</h4>
                  <p className="text-sm text-muted-foreground">
                    {casting.gender || 'Any'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Age Range</h4>
                  <p className="text-sm text-muted-foreground">
                    {casting.ageRange ? 
                      `${casting.ageRange.min || 'N/A'} - ${casting.ageRange.max || 'N/A'}` : 
                      'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Audition Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(casting.auditionDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarCheck className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Shoot Dates</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(casting.shootStartDate, casting.shootEndDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Application Deadline</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(casting.submissionDeadline || casting.deadline)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {casting.description && (
            <div className="space-y-2">
              <h3 className="font-medium">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {casting.description}
              </p>
            </div>
          )}

          {casting.requirements && casting.requirements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Requirements</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {casting.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {casting.skills && casting.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {casting.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {casting.uploadDetails && (
            <div className="space-y-2">
              <h3 className="font-medium">Upload Details</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {casting.uploadDetails}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            onClick={() => navigate(`/audition/apply/${casting._id}`)}
          >
            Apply Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Wrap the component with ErrorBoundary
export default function CastingDetails() {
  return (
    <ErrorBoundary>
      <CastingDetailsContent />
    </ErrorBoundary>
  );
}
