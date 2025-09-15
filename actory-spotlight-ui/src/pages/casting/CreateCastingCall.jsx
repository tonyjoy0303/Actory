import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import CastingCallForm from '@/components/CastingCallForm';
import SEO from '@/components/SEO';
import API from '@/lib/api';

export default function CreateCastingCall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Format dates to ISO string for the API
      const formattedData = {
        ...data,
        auditionDate: data.auditionDate.toISOString(),
        submissionDeadline: data.submissionDeadline.toISOString(),
        shootStartDate: data.shootStartDate.toISOString(),
        shootEndDate: data.shootEndDate.toISOString(),
      };
      
      const response = await API.post('/casting', formattedData);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Casting call created successfully!',
          variant: 'default',
          duration: 2000, // Show for 2 seconds
        });
        
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          navigate('/dashboard/producer');
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating casting call:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create casting call. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <SEO 
        title="Create Casting Call - Actory"
        description="Create a new casting call to find the perfect talent for your production."
      />
      
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Casting Call</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new casting call.
        </p>
      </div>

      <CastingCallForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}
