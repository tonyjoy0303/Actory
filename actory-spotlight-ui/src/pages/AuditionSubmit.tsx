import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import API from '@/lib/api';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

// Define types
interface CastingCall {
  _id: string;
  roleName: string;
  description: string;
  location?: string;
  ageRange?: string;
  skills?: string[];
  auditionDate?: string;
  shootingStartDate?: string;
  shootingEndDate?: string;
  producer?: { _id: string; name: string; email: string } | string;
}

export default function AuditionSubmit() {
  const { castingCallId } = useParams();
  const navigate = useNavigate();

  const [castingCall, setCastingCall] = useState<CastingCall | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [height, setHeight] = useState<string>(''); // cm
  const [weight, setWeight] = useState<string>(''); // kg
  const [age, setAge] = useState<string>('');
  const [skintone, setSkintone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchCastingCall = async () => {
      try {
        const { data } = await API.get(`/casting/${castingCallId}`);
        setCastingCall(data.data);
      } catch (error) {
        toast.error('Failed to load casting call details.');
        navigate('/dashboard/actor');
      }
    };
    if (castingCallId) {
      fetchCastingCall();
    }
  }, [castingCallId, navigate]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
    } else {
      toast.error('Please drop a valid video file.');
    }
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
    } else {
      toast.error('Please select a valid video file.');
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);

    if (!file || !title || !height || !weight || !age || !skintone) {
      toast.error('Please fill all fields and select a video file.');
      return;
    }
    if (Number.isNaN(h) || Number.isNaN(w) || Number.isNaN(a) || h <= 0 || w <= 0 || a <= 0) {
      toast.error('Please enter valid numeric values for height, weight, and age.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET!);

    try {
      // 1. Upload to Cloudinary
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percent);
          },
        }
      );

      const { secure_url, public_id } = cloudinaryRes.data;

      // 2. Submit to our backend
      await API.post(`/casting/${castingCallId}/videos`,
        { 
          title,
          videoUrl: secure_url,
          cloudinaryId: public_id,
          castingCall: castingCallId,
          height: h,
          weight: w,
          age: a,
          skintone: skintone.trim(),
        }
      );

      toast.success('Audition submitted successfully!');
      navigate('/dashboard/actor');

    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const src = file ? URL.createObjectURL(file) : undefined;

  return (
    <>
      <SEO title="Audition Submission" description="Upload your audition video with a simple drag-and-drop interface." />
      <section className="container py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Submit Your Audition for: {castingCall?.roleName || '...'}</CardTitle>
            <p className='text-muted-foreground text-sm pt-2'>{castingCall?.description}</p>
            {castingCall && (
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {castingCall.location && (
                  <div><span className="font-medium text-foreground">Location:</span> {castingCall.location}</div>
                )}
                {castingCall.ageRange && (
                  <div><span className="font-medium text-foreground">Age Range:</span> {castingCall.ageRange}</div>
                )}
                {(castingCall.auditionDate || castingCall.shootingStartDate || castingCall.shootingEndDate) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {castingCall.auditionDate && (
                      <div><span className="font-medium text-foreground">Audition:</span> {new Date(castingCall.auditionDate).toLocaleDateString()}</div>
                    )}
                    {castingCall.shootingStartDate && (
                      <div><span className="font-medium text-foreground">Shoot Start:</span> {new Date(castingCall.shootingStartDate).toLocaleDateString()}</div>
                    )}
                    {castingCall.shootingEndDate && (
                      <div><span className="font-medium text-foreground">Shoot End:</span> {new Date(castingCall.shootingEndDate).toLocaleDateString()}</div>
                    )}
                  </div>
                )}
                {castingCall.skills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {castingCall.skills.map((s) => (
                      <span key={s} className="px-2 py-1 rounded-full bg-secondary text-xs">{s}</span>
                    ))}
                  </div>
                ) : null}
                <div>
                  <span className="font-medium text-foreground">Producer:</span> {typeof castingCall.producer === 'object' ? castingCall.producer?.name : '—'}
                  {typeof castingCall.producer === 'object' && castingCall.producer?.email ? ` • ${castingCall.producer.email}` : ''}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div
              className="border-dashed border-2 rounded-lg p-10 text-center bg-card hover:shadow-[var(--shadow-elegant)] transition-shadow"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <p className="text-muted-foreground">Drag & drop your video here, or click to select a file</p>
              <div className="mt-4">
                <Input id="file-upload" type="file" accept="video/*" onChange={onSelect} className="sr-only" />
                <Button asChild variant="secondary">
                  <label htmlFor="file-upload">Choose File</label>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Input 
                placeholder="Give your audition a title (e.g., 'Dramatic Monologue')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />

              {/* Additional required fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Height (cm)</label>
                  <Input type="number" inputMode="numeric" min={50} max={300} step={1} placeholder="e.g., 175" value={height} onChange={(e) => setHeight(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Weight (kg)</label>
                  <Input type="number" inputMode="numeric" min={10} max={500} step={1} placeholder="e.g., 70" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Age</label>
                  <Input type="number" inputMode="numeric" min={1} max={120} step={1} placeholder="e.g., 26" value={age} onChange={(e) => setAge(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Skintone</label>
                  <Input placeholder="e.g., Fair, Medium, Dark" value={skintone} onChange={(e) => setSkintone(e.target.value)} disabled={loading} />
                </div>
              </div>

              {src && (
                <video ref={videoRef} controls className="w-full rounded-md shadow">
                  <source src={src} />
                </video>
              )}
              {loading && <Progress value={uploadProgress} className="w-full" />}
              <div className="mt-2 flex justify-end">
                <Button variant="hero" className="hover-scale" onClick={handleSubmit} disabled={loading || !file}>
                  {loading ? `Uploading... ${uploadProgress}%` : 'Submit Audition'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
