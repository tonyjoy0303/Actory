import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';

// Inline autoplay previews + full-size modal on click
const VideoList = ({ videos = [], user, onVideoDeleted, ownerName, ownerAvatar, profileOwnerId }) => {
  const [open, setOpen] = useState(false);
  const [activeSrc, setActiveSrc] = useState('');
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [items, setItems] = useState(videos || []);
  const [currentUserId, setCurrentUserId] = useState(null);
  const videoRef = useRef(null);

  // Load current user id and keep items in sync with props
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u && (u._id || u.id)) setCurrentUserId(String(u._id || u.id));
    } catch {}
  }, []);

  useEffect(() => {
    setItems(Array.isArray(videos) ? videos : []);
  }, [videos]);

  // Handle keyboard shortcuts for video playback
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!open || !videoRef.current) return;

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

  const handleShare = (src) => {
    if (!src) return;
    if (navigator.share) {
      navigator.share({ title: 'Actory Video', url: src }).catch(() => {});
    } else {
      navigator.clipboard.writeText(src);
      toast.success('Video link copied');
    }
  };

  const handleToggleLike = async (videoId) => {
    if (!videoId) return;
    if (!currentUserId) {
      toast.error('Please login to like videos');
      return;
    }
    try {
      const { data } = await API.put(`/videos/${videoId}/like`, { userId: currentUserId });
      if (data?.success) {
        setItems((prev) => prev.map(v => (
          v._id === videoId ? {
            ...v,
            likes: data.likes,
            // flip isLiked locally
            isLiked: data.isLiked,
            // update likedBy for future checks
            likedBy: (() => {
              const set = new Set((v.likedBy || []).map(x => String(x)));
              if (data.isLiked) set.add(String(currentUserId)); else set.delete(String(currentUserId));
              return Array.from(set);
            })()
          } : v
        )));
      }
    } catch (e) {
      toast.error('Failed to like video');
    }
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
    
    // If profileOwnerId is provided, check if current user is the profile owner
    if (profileOwnerId) {
      return user?.id === profileOwnerId;
    }
    
    // Fallback: Actors can only delete their own videos (for backward compatibility)
    if (user?.role === 'Actor' && video.actor === user?.id) {
      return true;
    }
    
    return false;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((video) => {
          const src = video?.videoUrl || video?.url || '';
          const poster = video?.thumbnailUrl || '';
          if (!src) return null;

          const showDeleteButton = canDeleteVideo(video);
          const isDeleting = deletingVideoId === video._id;
          const isLiked = video.isLiked || (currentUserId && (video.likedBy || []).some(id => String(id) === String(currentUserId)));

          return (
            <div
              key={video._id || src}
              className="group relative w-full rounded-md overflow-hidden focus:outline-none border bg-background"
            >
              {/* Header with owner */}
              <div className="flex items-center gap-3 px-3 py-2">
                {ownerAvatar ? (
                  <img src={ownerAvatar} alt={ownerName || 'Owner'} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}
                <div className="text-sm font-medium">{ownerName || 'Creator'}</div>
              </div>
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

              {/* Actions */}
              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleLike(video._id)}>
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <span className="text-xs text-muted-foreground">{video.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openModal(src)}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{video.comments || 0}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleShare(src)}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <div className="ml-auto">
                    {showDeleteButton && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVideo(video._id)}
                        disabled={isDeleting}
                        className="h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Caption */}
                <div className="text-sm">
                  <span className="font-semibold mr-1">{ownerName || 'Creator'}</span>
                  <span className="text-muted-foreground">{video.description || video.title}</span>
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