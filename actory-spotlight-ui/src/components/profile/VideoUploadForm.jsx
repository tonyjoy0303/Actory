import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import API from '@/lib/api';

const VideoUploadForm = ({ onUploadSuccess, onCancel }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    video: null
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: acceptedFiles => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFormData(prev => ({
          ...prev,
          video: file
        }));
        setPreview(URL.createObjectURL(file));
      }
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.video) {
      toast.error('Please select a video file');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('video', formData.video);
    formDataToSend.append('title', formData.title || 'Untitled Video');
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('category', formData.category || 'Other');
    // Explicitly set the type to 'profile' for profile videos
    formDataToSend.append('type', 'profile');

    setUploading(true);
    
    try {
      const { data } = await API.post('/profile/videos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        toast.success('Video uploaded successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(data.data);
        }
      } else {
        throw new Error(data.message || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error(error.response?.data?.message || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = () => {
    setPreview(null);
    setFormData(prev => ({
      ...prev,
      video: null
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upload New Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Video title"
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a description for your video"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => 
              setFormData(prev => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monologue">Monologue</SelectItem>
              <SelectItem value="Dance">Dance</SelectItem>
              <SelectItem value="Demo Reel">Demo Reel</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!preview ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">
                {isDragActive ? 'Drop the video here' : 'Drag & drop a video, or click to select'}
              </p>
              <p className="text-sm text-muted-foreground">MP4, MOV, AVI or WebM (max. 50MB)</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video 
              src={preview} 
              controls 
              className="w-full rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 rounded-full w-6 h-6"
              onClick={removeVideo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-2 space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.video || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : 'Upload Video'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VideoUploadForm;
