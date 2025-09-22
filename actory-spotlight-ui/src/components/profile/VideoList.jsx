import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';

// Inline autoplay previews + full-size modal on click
const VideoList = ({ videos = [], user, onVideoDeleted }) => {
  const [open, setOpen] = useState(false);
  const [activeSrc, setActiveSrc] = useState('');
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const videoRef = useRef(null);

  // Handle keyboard shortcuts for video playback
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!open || !videoRef.current) return;

      // Only handle arrow keys when modal is open
      if (e.key === 'ArrowRight' || e.key === '>') {
        e.preventDefault();
        const video = videoRef.current;
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
      } else if (e.key === 'ArrowLeft' || e.key === '<') {
        e.preventDefault();
        const video = videoRef.current;
        video.currentTime = Math.max(video.currentTime - 10, 0);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [open]);

  if (!Array.isArray(videos) || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos uploaded yet</p>
      </div>
    );
  }

  const openModal = (src) => {
    if (!src) return;
    setActiveSrc(src);
    setOpen(true);
  };

  const handleDeleteVideo = async (videoId) => {
    if (!videoId) return;

    const confirmed = window.confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingVideoId(videoId);

    try {
      const response = await API.delete(`/videos/profile/videos/${videoId}`);
      if (response.data.success) {
        toast.success('Video deleted successfully');
        // Notify parent component to update the video list
        if (onVideoDeleted) {
          onVideoDeleted(videoId);
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      const message = error.response?.data?.message || 'Failed to delete video';
      toast.error(message);
    } finally {
      setDeletingVideoId(null);
    }
  };

  const canDeleteVideo = (video) => {
    // Admins can delete any video
    if (user?.role === 'Admin') {
      return true;
    }
    // Actors can only delete their own videos
    if (user?.role === 'Actor' && video.actor === user?.id) {
      return true;
    }
    return false;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => {
          const src = video?.videoUrl || video?.url || '';
          const poster = video?.thumbnailUrl || '';
          if (!src) return null;

          const showDeleteButton = canDeleteVideo(video);
          const isDeleting = deletingVideoId === video._id;

          return (
            <div
              key={video._id || src}
              className="group relative w-full cursor-pointer rounded-md overflow-hidden focus:outline-none"
            >
              <button
                type="button"
                onClick={() => openModal(src)}
                className="w-full"
                aria-label="Open video"
              >
                <video
                  src={src}
                  poster={poster || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[9/16] rounded-md bg-black object-contain transition-transform group-hover:scale-[1.01]"
                  onError={(e) => {
                    // If playback fails, fallback to opening in a new tab
                    const open = window.confirm('Video failed to load. Open in a new tab?');
                    if (open && src) window.open(src, '_blank');
                  }}
                />
              </button>

              {/* Overlay with controls */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(src);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>

                  {showDeleteButton && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVideo(video._id);
                      }}
                      disabled={isDeleting}
                      className="bg-red-600/80 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] sm:max-h-[90vh] p-0 bg-black">
          <div className="w-full h-full bg-black flex items-center justify-center">
            {activeSrc && (
              <video
                ref={videoRef}
                key={activeSrc}
                src={activeSrc}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoList;