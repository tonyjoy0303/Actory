import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import API from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import InternalShareDialog from '@/components/media/InternalShareDialog';
import shareInternalIcon from '@/assets/share-internal.svg';

// Inline autoplay previews + full-size modal on click
const VideoList = ({ videos = [], user, onVideoDeleted, ownerName, ownerAvatar, profileOwnerId }) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [items, setItems] = useState(videos || []);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedItemForComments, setSelectedItemForComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [mediaComments, setMediaComments] = useState({});
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [mediaToShare, setMediaToShare] = useState(null);
  const videoRef = useRef(null);

  // Load current user id and keep items in sync with props
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u && (u._id || u.id)) {
        setCurrentUserId(String(u._id || u.id));
        setCurrentUser(u);
      }
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
        <p className="text-muted-foreground">No media uploaded yet</p>
      </div>
    );
  }

  const isImageItem = (item) => item?.mediaType === 'image' || item?.resourceType === 'image';
  const getMediaSrc = (item) => item?.mediaUrl || item?.videoUrl || item?.url || '';

  const openModal = (item) => {
    const src = getMediaSrc(item);
    if (!src) return;
    setActiveItem({ ...item, src });
    setOpen(true);
  };

  const handleShare = (item) => {
    const src = getMediaSrc(item);

    if (!currentUser?._id) {
      toast.error('Please login to share media in-app');
      return;
    }

    if (!item?._id || !src) return;

    setMediaToShare({
      id: item._id,
      title: item.title || item.description || 'Media post',
      shareUrl: src,
      thumbnailUrl: item.thumbnailUrl || src,
      mediaType: isImageItem(item) ? 'image' : 'video',
    });
    setIsShareDialogOpen(true);
  };

  const handleToggleLike = async (videoId) => {
    if (!videoId) return;
    if (!currentUserId) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const { data } = await API.put(`/videos/${videoId}/like`, { userId: currentUserId });
      if (data?.success) {
        let updatedActiveItem = null;
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

        setActiveItem((prev) => {
          if (!prev || prev._id !== videoId) return prev;
          updatedActiveItem = {
            ...prev,
            likes: data.likes,
            isLiked: data.isLiked,
            likedBy: (() => {
              const set = new Set((prev.likedBy || []).map(x => String(x)));
              if (data.isLiked) set.add(String(currentUserId)); else set.delete(String(currentUserId));
              return Array.from(set);
            })()
          };
          return updatedActiveItem;
        });

        if (selectedItemForComments?._id === videoId && updatedActiveItem) {
          setSelectedItemForComments(updatedActiveItem);
        }
      }
    } catch (e) {
      toast.error('Failed to like post');
    }
  };

  const openCommentModal = async (item) => {
    if (!item?._id) return;
    if (!currentUserId) {
      toast.error('Please login to comment on posts');
      return;
    }

    setSelectedItemForComments(item);
    setIsCommentModalOpen(true);

    try {
      const { data } = await API.get(`/videos/${item._id}/comments`);
      if (data?.success) {
        setMediaComments((prev) => ({
          ...prev,
          [item._id]: data.data || []
        }));
      }
    } catch (error) {
      setMediaComments((prev) => ({
        ...prev,
        [item._id]: prev[item._id] || []
      }));
    }
  };

  const closeCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedItemForComments(null);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!selectedItemForComments?._id || !newComment.trim() || !currentUserId) return;

    try {
      const { data } = await API.post(`/videos/${selectedItemForComments._id}/comment`, {
        userId: currentUserId,
        comment: newComment.trim()
      });

      if (data?.success) {
        const createdComment = data.comment;

        setMediaComments((prev) => ({
          ...prev,
          [selectedItemForComments._id]: [
            createdComment,
            ...(prev[selectedItemForComments._id] || [])
          ]
        }));

        setItems((prev) => prev.map(v => (
          v._id === selectedItemForComments._id
            ? { ...v, comments: data.comments }
            : v
        )));

        setActiveItem((prev) => (
          prev && prev._id === selectedItemForComments._id
            ? { ...prev, comments: data.comments }
            : prev
        ));

        setSelectedItemForComments((prev) => (
          prev ? { ...prev, comments: data.comments } : prev
        ));

        setNewComment('');
        toast.success('Comment added');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!videoId) return;

    const confirmed = window.confirm('Are you sure you want to delete this media post? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingVideoId(videoId);

    try {
      const response = await API.delete(`/videos/profile/videos/${videoId}`);
      if (response.data.success) {
        toast.success('Media deleted successfully');
        // Notify parent component to update the video list
        if (onVideoDeleted) {
          onVideoDeleted(videoId);
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      const message = error.response?.data?.message || 'Failed to delete media';
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
      return String(user?.id || user?._id || '') === String(profileOwnerId);
    }
    
    // Fallback: Actors can only delete their own videos (for backward compatibility)
    if (String(video.actor) === String(user?.id || user?._id || '')) {
      return true;
    }
    
    return false;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((video) => {
          const src = getMediaSrc(video);
          const poster = video?.thumbnailUrl || '';
          const isImage = isImageItem(video);
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
                onClick={() => openModal(video)}
                className="w-full"
                aria-label="Open media"
              >
                {isImage ? (
                  <img
                    src={src}
                    alt={video.description || video.title || 'Profile media'}
                    className="w-full aspect-[9/16] rounded-md bg-black/5 object-contain transition-transform group-hover:scale-[1.01]"
                  />
                ) : (
                  <video
                    src={src}
                    poster={poster || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full aspect-[9/16] rounded-md bg-black object-contain transition-transform group-hover:scale-[1.01]"
                    onError={() => {
                      const shouldOpen = window.confirm('Media failed to load. Open in a new tab?');
                      if (shouldOpen && src) window.open(src, '_blank');
                    }}
                  />
                )}
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
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openModal(video)}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{video.comments || 0}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/80 hover:bg-black text-white" onClick={() => handleShare(video)}>
                    <img src={shareInternalIcon} alt="Share" className="h-5 w-5 invert" />
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
        <DialogContent className="w-[96vw] max-w-[96vw] h-[96vh] max-h-[96vh] p-0 bg-black">
          <div className="w-full h-full bg-black flex flex-col">
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {activeItem && (
                isImageItem(activeItem) ? (
                  <img
                    src={activeItem.src}
                    alt={activeItem.description || activeItem.title || 'Profile media'}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeItem.src}
                    src={activeItem.src}
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )
              )}
            </div>

            {activeItem && (
              <div className="px-4 py-3 bg-background border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleLike(activeItem._id)}>
                        <Heart className={`h-5 w-5 ${(activeItem.isLiked || (currentUserId && (activeItem.likedBy || []).some(id => String(id) === String(currentUserId)))) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <span className="text-xs text-muted-foreground">{activeItem.likes || 0}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCommentModal(activeItem)}>
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                      <span className="text-xs text-muted-foreground">{activeItem.comments || 0}</span>
                    </div>

                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/80 hover:bg-black text-white" onClick={() => handleShare(activeItem)}>
                      <img src={shareInternalIcon} alt="Share" className="h-5 w-5 invert" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {activeItem.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentModalOpen} onOpenChange={closeCommentModal}>
        <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] p-0">
          <div className="p-6 pb-4 border-b">
            <h3 className="text-lg font-semibold">
              Comments ({selectedItemForComments ? (mediaComments[selectedItemForComments._id] || []).length : 0})
            </h3>
            <p className="text-sm text-muted-foreground">View and add comments for this post</p>
          </div>

          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {(() => {
                const currentComments = selectedItemForComments ? (mediaComments[selectedItemForComments._id] || []) : [];
                if (currentComments.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  );
                }

                return currentComments.map((comment) => {
                  const displayName = comment?.user?.name || comment?.user?.companyName || 'Unknown User';
                  const displayInitial = comment?.user?.name?.charAt(0) || comment?.user?.companyName?.charAt(0) || 'U';

                  return (
                    <div key={comment._id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment?.user?.profileImage || undefined} />
                        <AvatarFallback>{displayInitial}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {comment?.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : ''}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="border-t p-4 space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InternalShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        media={mediaToShare}
        currentUser={currentUser}
      />
    </>
  );
};

export default VideoList;