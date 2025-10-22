import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, User, Calendar, Eye } from 'lucide-react';
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import API from "@/lib/api";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Feeds = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [videoComments, setVideoComments] = useState({}); // Store comments per video ID
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Fetch all public videos
  const { data: videosData, isLoading, error, refetch } = useQuery({
    queryKey: ['publicVideos'],
    queryFn: async () => {
      const { data } = await API.get('/videos/public');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const videos = videosData?.data || [];

  // Handle keyboard navigation when video modal is open
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVideoModalOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          goToNextVideo();
          break;
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousVideo();
          break;
        case 'Escape':
          event.preventDefault();
          closeVideoModal();
          break;
        default:
          break;
      }
    };

    if (isVideoModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoModalOpen, currentVideoIndex, videos]);

  const openVideoModal = async (video) => {
    const videoIndex = videos.findIndex(v => v._id === video._id);
    setCurrentVideoIndex(videoIndex);
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
    
    // Track video view (only once per user per video)
    try {
      const viewedVideos = JSON.parse(localStorage.getItem('viewedVideos') || '[]');
      
      if (!viewedVideos.includes(video._id)) {
        await API.put(`/videos/${video._id}/view`);
        
        // Mark video as viewed by this user
        viewedVideos.push(video._id);
        localStorage.setItem('viewedVideos', JSON.stringify(viewedVideos));
        
        // Refetch videos to update view counts
        refetch();
      }
    } catch (error) {
      console.error('Error tracking video view:', error);
      // Don't show error to user as this is not critical
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
    setCurrentVideoIndex(0);
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      setSelectedVideo(videos[nextIndex]);
    }
  };

  const goToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      setSelectedVideo(videos[prevIndex]);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser._id) {
        toast.error('Please login to like videos');
        return;
      }

      const { data } = await API.put(`/videos/${videoId}/like`, {
        userId: currentUser._id
      });

      if (data.success) {
        // Update the video in the local state immediately
        const updatedVideos = videos.map(video => 
          video._id === videoId 
            ? { ...video, likes: data.likes, isLiked: data.isLiked }
            : video
        );
        
        // Update the videos data directly
        queryClient.setQueryData(['publicVideos'], (oldData) => ({
          ...oldData,
          data: updatedVideos
        }));
        
        toast.success(data.isLiked ? 'Liked!' : 'Unliked!');
      }
    } catch (error) {
      console.error('Error liking video:', error);
      toast.error('Failed to like video');
    }
  };

  const handleShare = async (video) => {
    const shareUrl = `${window.location.origin}/profile/${video.actor._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${video.actor.name}'s Video`,
          text: video.description || video.title,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Video link copied to clipboard!');
    }
  };

  const handleComment = async (video) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser._id) {
        toast.error('Please login to comment on videos');
        return;
      }

      // Open comment modal
      setSelectedVideoForComments(video);
      setIsCommentModalOpen(true);
      
      // Load existing comments for this video from API
      try {
        const { data } = await API.get(`/videos/${video._id}/comments`);
        if (data.success) {
          setVideoComments(prev => ({
            ...prev,
            [video._id]: data.data
          }));
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        // If no comments exist yet, set empty array
        setVideoComments(prev => ({
          ...prev,
          [video._id]: []
        }));
      }
    } catch (error) {
      console.error('Error opening comment modal:', error);
      toast.error('Failed to open comments');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedVideoForComments) return;

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const { data } = await API.post(`/videos/${selectedVideoForComments._id}/comment`, {
        userId: currentUser._id,
        comment: newComment.trim()
      });

      if (data.success) {
        // Add new comment to the list using the comment returned from API
        const newCommentObj = data.comment;
        
        // Update comments for this specific video
        setVideoComments(prev => ({
          ...prev,
          [selectedVideoForComments._id]: [
            newCommentObj,
            ...(prev[selectedVideoForComments._id] || [])
          ]
        }));
        
        setNewComment('');
        
        // Update the video counter
        const updatedVideos = videos.map(v => 
          v._id === selectedVideoForComments._id 
            ? { ...v, comments: data.comments }
            : v
        );
        
        queryClient.setQueryData(['publicVideos'], (oldData) => ({
          ...oldData,
          data: updatedVideos
        }));
        
        toast.success('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const closeCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedVideoForComments(null);
    setNewComment(''); // Only clear the new comment input
    // Don't clear videoComments - keep them for persistence
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Feeds - Actory" description="Discover videos from talented actors" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Feeds</h1>
            <p className="text-muted-foreground mb-4">
              {error.response?.data?.message || 'Failed to load videos'}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Feeds - Actory" description="Discover videos from talented actors" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Videos</h1>
          <p className="text-muted-foreground">
            Explore amazing content from talented actors in our community
          </p>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="w-full aspect-[9/16]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-semibold mb-2">No Videos Yet</h2>
            <p className="text-muted-foreground">
              Be the first to share your talent with the community!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Card key={video._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Video Thumbnail */}
                  <div className="relative group">
                    <video
                      src={video.videoUrl || video.url}
                      poster={video.thumbnailUrl}
                      className="w-full aspect-[9/16] object-cover cursor-pointer"
                      onClick={() => openVideoModal(video)}
                      onMouseEnter={(e) => e.target.play()}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                      muted
                      loop
                      playsInline
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => openVideoModal(video)}
                        className="rounded-full"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Watch
                      </Button>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 cursor-pointer" onClick={() => video.actor?._id && navigate(`/profile/${video.actor._id}`)}>
                        <AvatarImage src={video.actor?.profileImage} />
                        <AvatarFallback>
                          {video.actor?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => video.actor?._id && navigate(`/profile/${video.actor._id}`)}>
                        <p className="text-sm font-medium truncate">
                          {video.actor?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {video.createdAt && format(new Date(video.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Video Description */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {video.title || 'Untitled Video'}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Video Stats */}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {video.views || 0} views
                      </span>
                      {video.duration && (
                        <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLike(video._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Heart className={`h-4 w-4 ${video.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {video.likes || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleComment(video)}
                            className="h-8 w-8 p-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {video.comments || 0}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShare(video)}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Video Type Badge */}
                      {video.type && (
                        <Badge variant="secondary" className="text-xs">
                          {video.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] sm:max-h-[90vh] p-0 bg-black">
          {selectedVideo && (
            <div className="w-full h-full bg-black flex flex-col">
              {/* Video Navigation Header */}
              <div className="flex items-center justify-end p-4 bg-black/50 text-white">
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <span>↑ Previous</span>
                  <span>↓ Next</span>
                  <span>ESC Close</span>
                </div>
              </div>

              {/* Video Player */}
              <div className="flex-1 flex items-center justify-center relative">
                <video
                  src={selectedVideo.videoUrl || selectedVideo.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation Buttons */}
                <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToPreviousVideo}
                    disabled={currentVideoIndex === 0}
                    className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white ml-4"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToNextVideo}
                    disabled={currentVideoIndex === videos.length - 1}
                    className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white mr-4"
                  >
                    →
                  </Button>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="p-4 bg-background border-t">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="cursor-pointer" onClick={() => selectedVideo?.actor?._id && navigate(`/profile/${selectedVideo.actor._id}`)}>
                    <AvatarImage src={selectedVideo.actor?.profileImage} />
                    <AvatarFallback>
                      {selectedVideo.actor?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="cursor-pointer" onClick={() => selectedVideo?.actor?._id && navigate(`/profile/${selectedVideo.actor._id}`)}>
                    <p className="font-medium">{selectedVideo.actor?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedVideo.createdAt && format(new Date(selectedVideo.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <h2 className="font-semibold mb-2">
                  {selectedVideo.title || 'Untitled Video'}
                </h2>
                
                {selectedVideo.description && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {selectedVideo.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedVideo.views || 0} views
                  </span>
                  {selectedVideo.duration && (
                    <span>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      <Dialog open={isCommentModalOpen} onOpenChange={closeCommentModal}>
        <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-lg font-semibold">
              Comments ({selectedVideoForComments ? (videoComments[selectedVideoForComments._id] || []).length : 0})
            </DialogTitle>
            <DialogDescription>
              View and add comments for this video
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[60vh]">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4">
              {(() => {
                const currentComments = selectedVideoForComments ? (videoComments[selectedVideoForComments._id] || []) : [];
                
                if (currentComments.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  );
                }
                
                return currentComments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.profileImage} />
                      <AvatarFallback>
                        {comment.user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(comment.createdAt, 'MMM d, h:mm a')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground">
                        {comment.comment}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <button className="hover:text-foreground transition-colors">
                          Like ({comment.likes})
                        </button>
                        <button className="hover:text-foreground transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* Add Comment Section */}
            <div className="border-t p-6">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.profileImage} />
                  <AvatarFallback>
                    {currentUser?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feeds;
