import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import CastingCallForm from '@/components/CastingCallForm';
import API from '@/lib/api';
import SEO from '@/components/SEO';

export default function EditCastingCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [castingCall, setCastingCall] = useState(null);

  useEffect(() => {
    const fetchCastingCall = async () => {
      try {
        const { data } = await API.get(`/casting/${id}`);
        if (data.success) {
          setCastingCall(data.data);
        } else {
          throw new Error('Failed to load casting call');
        }
      } catch (error) {
        console.error('Error fetching casting call:', error);
        toast({
          title: 'Error',
          description: 'Failed to load casting call. Please try again.',
          variant: 'destructive',
        });
        navigate('/producer/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchCastingCall();
  }, [id, navigate, toast]);

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Casting call updated successfully!',
      variant: 'default',
    });
    navigate(`/casting/${id}`);
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!castingCall) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">Casting call not found.</p>
        <Button onClick={() => navigate('/producer/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <SEO 
        title={`Edit ${castingCall.roleTitle} - Actory`}
        description={`Edit the casting call for ${castingCall.roleTitle}`}
      />
      
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 pl-0 hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">Edit Casting Call</h1>
        <p className="text-muted-foreground mt-2">
          Update the details for this casting call.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <CastingCallForm castingCall={castingCall} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
