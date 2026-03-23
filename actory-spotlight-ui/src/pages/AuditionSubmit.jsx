import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Scissors, X } from 'lucide-react';

import API from '@/lib/api';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import VideoTimelineSelector from '@/components/VideoTimelineSelector';
import { trimVideoSegment } from '@/utils/videoTrimmer';

const MAX_VIDEO_DURATION = 240;

function computeAge(dobValue) {
  if (!dobValue) return NaN;
  const dob = new Date(dobValue);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export default function AuditionSubmit() {
  const { castingCallId } = useParams();
  const navigate = useNavigate();

  const [castingCall, setCastingCall] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [livingCity, setLivingCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [portfolioFile, setPortfolioFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [webcamPhoto, setWebcamPhoto] = useState(null);
  const [webcamPhotoPreview, setWebcamPhotoPreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [portfolioUploadProgress, setPortfolioUploadProgress] = useState(0);
  const [idProofUploadProgress, setIdProofUploadProgress] = useState(0);

  const [videoSelection, setVideoSelection] = useState({
    totalDuration: 0,
    startTime: 0,
    endTime: 0,
    selectedDuration: 0,
    exceedsLimit: false,
  });

  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const selectedPreviewRef = useRef(null);

  const formatTime = (seconds) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchCastingCall = async () => {
      try {
        const { data } = await API.get(`/casting/${castingCallId}`);
        setCastingCall(data.data);
      } catch {
        toast.error('Failed to load casting call details.');
        navigate('/dashboard/actor');
      }
    };

    if (castingCallId) {
      fetchCastingCall();
    }
  }, [castingCallId, navigate]);

  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (webcamPhotoPreview) {
        URL.revokeObjectURL(webcamPhotoPreview);
      }
    };
  }, [webcamPhotoPreview]);

  const src = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  useEffect(() => {
    if (!selectedPreviewRef.current || !src) return;
    const player = selectedPreviewRef.current;
    const start = Number(videoSelection.startTime || 0);
    if (Number.isFinite(start)) {
      player.currentTime = start;
    }
  }, [src, videoSelection.startTime, videoSelection.endTime]);

  const handleSelectedPreviewLoadedMetadata = () => {
    if (!selectedPreviewRef.current) return;
    const start = Number(videoSelection.startTime || 0);
    selectedPreviewRef.current.currentTime = start;
  };

  const handleSelectedPreviewPlay = () => {
    if (!selectedPreviewRef.current) return;
    const player = selectedPreviewRef.current;
    const start = Number(videoSelection.startTime || 0);
    const end = Number(videoSelection.endTime || 0);
    if (player.currentTime < start || player.currentTime > end) {
      player.currentTime = start;
    }
  };

  const handleSelectedPreviewTimeUpdate = () => {
    if (!selectedPreviewRef.current) return;
    const player = selectedPreviewRef.current;
    const end = Number(videoSelection.endTime || 0);
    if (end > 0 && player.currentTime >= end) {
      player.pause();
      player.currentTime = end;
    }
  };

  const stopCamera = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        await webcamVideoRef.current.play();
      }
    } catch {
      setCameraActive(false);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    const videoEl = webcamVideoRef.current;
    if (!videoEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      if (webcamPhotoPreview) {
        URL.revokeObjectURL(webcamPhotoPreview);
      }
      const preview = URL.createObjectURL(blob);
      setWebcamPhoto(blob);
      setWebcamPhotoPreview(preview);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleaned = skillInput.trim();
    if (cleaned && !skills.includes(cleaned)) {
      setSkills((prev) => [...prev, cleaned]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const onDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer?.files?.[0];
    if (!selected || !selected.type.startsWith('video/')) {
      toast.error('Please drop a valid video file.');
      return;
    }
    setFile(selected);
    setVideoSelection({
      totalDuration: 0,
      startTime: 0,
      endTime: 0,
      selectedDuration: 0,
      exceedsLimit: false,
    });
  };

  const onSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected || !selected.type.startsWith('video/')) {
      toast.error('Please select a valid video file.');
      return;
    }
    setFile(selected);
    setVideoSelection({
      totalDuration: 0,
      startTime: 0,
      endTime: 0,
      selectedDuration: 0,
      exceedsLimit: false,
    });
  };

  const onSelectPortfolio = (e) => {
    const selected = e.target.files?.[0];
    const maxBytes = 500 * 1024;
    if (!selected || selected.type !== 'application/pdf') {
      setPortfolioFile(null);
      toast.error('Please select a valid PDF file for your portfolio.');
      return;
    }
    if (selected.size > maxBytes) {
      setPortfolioFile(null);
      toast.error('Portfolio PDF must be 500 KB or smaller.');
      return;
    }
    setPortfolioFile(selected);
  };

  const onSelectIdProof = (e) => {
    const selected = e.target.files?.[0];
    const maxBytes = 2 * 1024 * 1024;
    if (!selected) {
      setIdProofFile(null);
      return;
    }
    const allowed = selected.type.startsWith('image/') || selected.type === 'application/pdf';
    if (!allowed) {
      setIdProofFile(null);
      toast.error('ID proof must be an image or PDF.');
      return;
    }
    if (selected.size > maxBytes) {
      setIdProofFile(null);
      toast.error('ID proof must be 2 MB or smaller.');
      return;
    }
    setIdProofFile(selected);
  };

  const handleSubmit = async () => {
    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);

    if (!file || !portfolioFile || !idProofFile || !webcamPhoto || !title || !height || !weight || !age || skills.length === 0 || !permanentAddress || !livingCity || !dateOfBirth || !phoneNumber) {
      toast.error('Please fill all fields, select a video, upload portfolio, provide ID proof, capture webcam photo, and add at least one skill.');
      return;
    }

    if (!videoSelection.selectedDuration || videoSelection.selectedDuration > MAX_VIDEO_DURATION) {
      toast.error('Please select a valid video duration up to 4 minutes.');
      return;
    }

    if (Number.isNaN(h) || Number.isNaN(w) || Number.isNaN(a) || h <= 0 || w <= 0 || a <= 0) {
      toast.error('Please enter valid numeric values for height, weight, and age.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!dateOfBirth || dateOfBirth > todayStr) {
      toast.error('Please enter a valid date of birth (not in the future).');
      return;
    }

    const derivedAge = computeAge(dateOfBirth);
    if (!Number.isFinite(derivedAge) || derivedAge <= 0 || derivedAge > 120) {
      toast.error('Please enter a valid date of birth.');
      return;
    }

    if (a !== derivedAge) {
      setAge(String(derivedAge));
      toast.error('Age does not match date of birth. It was auto-corrected.');
      return;
    }

    setLoading(true);

    try {
      let videoFileToUpload = file;
      const needsTrim = videoSelection.startTime > 0 || videoSelection.endTime < videoSelection.totalDuration;

      if (needsTrim) {
        setTrimming(true);
        setTrimProgress(0);
        toast.info('Trimming selected video segment...');
        videoFileToUpload = await trimVideoSegment(
          file,
          videoSelection.startTime,
          videoSelection.endTime,
          (progress) => setTrimProgress(progress)
        );
        setTrimming(false);
        toast.success('Video segment trimmed. Starting upload...');
      }

      const videoForm = new FormData();
      videoForm.append('file', videoFileToUpload);
      videoForm.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const portfolioPreset = import.meta.env.VITE_CLOUDINARY_PORTFOLIO_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const idProofPreset = import.meta.env.VITE_CLOUDINARY_IDPROOF_PRESET || portfolioPreset;
      const webcamPreset = import.meta.env.VITE_CLOUDINARY_WEBCAM_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!portfolioPreset || !idProofPreset || !webcamPreset) {
        throw new Error('Missing Cloudinary upload presets.');
      }

      const portfolioForm = new FormData();
      portfolioForm.append('file', portfolioFile);
      portfolioForm.append('upload_preset', portfolioPreset);
      portfolioForm.append('folder', 'portfolio');

      const idProofForm = new FormData();
      idProofForm.append('file', idProofFile);
      idProofForm.append('upload_preset', idProofPreset);
      idProofForm.append('folder', 'id-proof');

      const webcamForm = new FormData();
      webcamForm.append('file', new File([webcamPhoto], 'webcam.jpg', { type: 'image/jpeg' }));
      webcamForm.append('upload_preset', webcamPreset);
      webcamForm.append('folder', 'webcam');

      const cloudinaryVideoRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        videoForm,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
            setUploadProgress(percent);
          },
        }
      );

      const portfolioRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        portfolioForm,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
            setPortfolioUploadProgress(percent);
          },
        }
      );

      const idProofRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload`,
        idProofForm,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
            setIdProofUploadProgress(percent);
          },
        }
      );

      const webcamRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        webcamForm,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setUploadProgress(100);
      setAnalyzingAI(true);
      toast.info('Upload complete! Analyzing your video performance...');

      await API.post(
        `/casting/${castingCallId}/videos`,
        {
          title,
          videoUrl: cloudinaryVideoRes.data.secure_url,
          cloudinaryId: cloudinaryVideoRes.data.public_id,
          castingCall: castingCallId,
          height: h,
          weight: w,
          age: a,
          skills,
          permanentAddress,
          livingCity,
          dateOfBirth,
          phoneNumber,
          email,
          portfolioUrl: portfolioRes.data?.secure_url,
          idProofUrl: idProofRes.data?.secure_url,
          webcamPhotoUrl: webcamRes.data?.secure_url,
          videoHeight: 720,
          duration: videoSelection.selectedDuration,
          brightness: 0.75,
          audioQuality: 0.8,
          retakes: 1,
          cropData: {
            startTime: videoSelection.startTime,
            endTime: videoSelection.endTime,
            croppedDuration: videoSelection.selectedDuration,
            originalDuration: videoSelection.totalDuration,
          },
        },
        { timeout: 360000 }
      );

      toast.success('Audition submitted successfully!');
      navigate('/dashboard/actor');
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Submission failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
      setAnalyzingAI(false);
      setTrimming(false);
    }
  };

  return (
    <>
      <SEO title="Audition Submission" description="Upload your audition video and submit only your best segment." />
      <section className="container py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Submit Your Audition for: {castingCall?.roleTitle || castingCall?.roleName || '...'}
            </CardTitle>
            <p className="text-muted-foreground text-sm pt-2">{castingCall?.description}</p>
          </CardHeader>

          <CardContent>
            <div
              className="border-dashed border-2 rounded-lg p-10 text-center bg-card hover:shadow-[var(--shadow-elegant)] transition-shadow"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <p className="text-muted-foreground">Drag & drop your video here, or click to select a file</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">Only 4 minutes maximum. If your video is longer, select any segment up to 4 minutes using the timeline below.</p>
              <div className="mt-4">
                <Input id="file-upload" type="file" accept="video/*" onChange={onSelect} className="sr-only" />
                <Button asChild variant="secondary">
                  <label htmlFor="file-upload">Choose File</label>
                </Button>
              </div>
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                <div className="rounded-md border p-3 text-sm bg-muted/30 flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Timeline selection is mandatory. Uploaded submission will include only the selected range.
                </div>
                <VideoTimelineSelector
                  file={file}
                  maxDuration={MAX_VIDEO_DURATION}
                  onSelectionChange={setVideoSelection}
                />
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <Input
                placeholder="Give your audition a title (e.g., Dramatic Monologue)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Height (cm)</label>
                  <Input type="number" min={50} max={300} step={1} value={height} onChange={(e) => setHeight(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Weight (kg)</label>
                  <Input type="number" min={10} max={500} step={1} value={weight} onChange={(e) => setWeight(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Age</label>
                  <Input type="number" min={1} max={120} step={1} value={age} onChange={(e) => setAge(e.target.value)} disabled={loading} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Permanent Address *</label>
                  <Input value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Living City *</label>
                  <Input value={livingCity} onChange={(e) => setLivingCity(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Date of Birth *</label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      const calculated = computeAge(e.target.value);
                      if (Number.isFinite(calculated)) setAge(String(calculated));
                    }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone Number *</label>
                  <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={loading} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Email Address (Optional)</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Skills *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., Dancing, Martial Arts)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    disabled={loading}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddSkill} disabled={loading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Portfolio (PDF)</label>
                <Input type="file" accept="application/pdf" onChange={onSelectPortfolio} disabled={loading} />
                {portfolioFile ? <p className="text-xs text-muted-foreground mt-1">{portfolioFile.name}</p> : null}
              </div>

              <div>
                <label className="block text-sm mb-1">Government ID Proof *</label>
                <Input type="file" accept="application/pdf,image/*" onChange={onSelectIdProof} disabled={loading} />
                {idProofFile ? <p className="text-xs text-muted-foreground mt-1">{idProofFile.name}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm mb-1">Webcam Photo *</label>
                {webcamPhotoPreview && (
                  <img src={webcamPhotoPreview} alt="Webcam capture" className="w-full max-w-sm rounded-md border" style={{ transform: 'scaleX(-1)' }} />
                )}
                {!webcamPhotoPreview && cameraActive && (
                  <video ref={webcamVideoRef} className="w-full max-w-sm rounded-md border bg-black" style={{ transform: 'scaleX(-1)' }} autoPlay playsInline muted />
                )}
                <div className="flex gap-2">
                  {!cameraActive && !webcamPhotoPreview && (
                    <Button type="button" variant="secondary" onClick={startCamera} disabled={loading}>Start Camera</Button>
                  )}
                  {cameraActive && (
                    <Button type="button" variant="secondary" onClick={capturePhoto} disabled={loading}>Capture Photo</Button>
                  )}
                  {cameraActive && (
                    <Button type="button" variant="outline" onClick={stopCamera} disabled={loading}>Cancel</Button>
                  )}
                  {webcamPhotoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setWebcamPhoto(null);
                        if (webcamPhotoPreview) {
                          URL.revokeObjectURL(webcamPhotoPreview);
                        }
                        setWebcamPhotoPreview('');
                        startCamera();
                      }}
                      disabled={loading}
                    >
                      Retake
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Use your device camera to capture a clear photo.</p>
              </div>

              {src ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Selected segment preview (this is what will be uploaded):
                    {' '}
                    {formatTime(videoSelection.startTime)} - {formatTime(videoSelection.endTime)}
                    {' '}
                    ({formatTime(videoSelection.selectedDuration)})
                  </div>
                  <video
                    ref={selectedPreviewRef}
                    controls
                    className="w-full rounded-md shadow max-h-72 bg-black"
                    onLoadedMetadata={handleSelectedPreviewLoadedMetadata}
                    onPlay={handleSelectedPreviewPlay}
                    onTimeUpdate={handleSelectedPreviewTimeUpdate}
                  >
                    <source src={src} />
                  </video>
                </div>
              ) : null}

              {(loading || trimming) && (
                <div className="space-y-2">
                  {trimming && <Progress value={trimProgress} className="w-full" />}
                  <Progress value={uploadProgress} className="w-full" />
                  {portfolioFile ? <Progress value={portfolioUploadProgress} className="w-full" /> : null}
                  {idProofFile ? <Progress value={idProofUploadProgress} className="w-full" /> : null}
                </div>
              )}

              <div className="mt-2 flex justify-end">
                <Button
                  variant="hero"
                  className="hover-scale"
                  onClick={handleSubmit}
                  disabled={loading || trimming || !file || !portfolioFile || !idProofFile || !webcamPhoto || !videoSelection.selectedDuration}
                >
                  {trimming
                    ? `Trimming video... ${trimProgress}%`
                    : loading
                    ? analyzingAI
                      ? 'Analyzing video performance... Please wait'
                      : `Uploading... ${uploadProgress}%`
                    : 'Submit Audition'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
