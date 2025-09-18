import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Eye, Clock, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import API from '@/lib/api';

const VideoList = ({ videos = [], isOwner = false, onVideoDeleted, onVideoPlay }) => {
  const [filteredVideos, setFilteredVideos] = useState(videos);
  const [activeCategory, setActiveCategory] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Group videos by category, defaulting to 'uncategorized' if category is not set
  const categories = ['all', ...new Set(videos.map(video => video.category || 'uncategorized'))];

  // Filter videos when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredVideos([...videos]);
    } else {
      setFilteredVideos(videos.filter(video => (video.category || 'uncategorized') === activeCategory));
    }
  }, [activeCategory, videos]);

  // Handle view count increment and video playback
  const handleVideoPlay = async (video) => {
    try {
      // If onVideoPlay prop is provided, use it (for modal playback)
      if (onVideoPlay) {
        onVideoPlay(video);
      } else {
        // Otherwise, open in a new tab as fallback
        window.open(video.videoUrl, '_blank');
      }
      
      // Increment view count
      await API.put(`/profile/videos/${video._id}/view`);
    } catch (error) {
      console.error('Error handling video play:', error);
      toast({
        title: 'Error',
        description: 'Could not play the video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle video deletion
  const confirmDelete = (video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;
    
    try {
      setDeleting(true);
      await API.delete(`/profile/videos/${videoToDelete._id}`);
      toast({
        title: 'Video deleted',
        description: 'The video has been removed from your profile.',
      });
      if (onVideoDeleted) {
        onVideoDeleted(videoToDelete._id);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete video',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No videos uploaded yet.</p>
        {isOwner && (
          <p className="text-sm text-muted-foreground mt-2">Upload your first video to get started!</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="all" 
        className="w-full"
        onValueChange={(value) => setActiveCategory(value)}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {typeof category === 'string' ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized'}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="text-sm text-muted-foreground">
            {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
          </div>
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video._id} className="overflow-hidden group">
              <div className="relative aspect-video bg-black">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/30 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoPlay(video);
                    }}
                  >
                    <Play className="h-8 w-8 fill-current" />
                  </Button>
                </div>
                <Badge className="absolute top-2 left-2 bg-black/70 hover:bg-black/80">
                  {video.category || 'uncategorized'}
                </Badge>
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => confirmDelete(video)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-medium line-clamp-2">
                  {video.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{video.views} {video.views === 1 ? 'view' : 'views'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  <div className="text-xs">
                    {video.uploadedAt ? (
                      formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })
                    ) : 'Recently'}
                  </div>
                </div>
                {video.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to format duration (seconds) to MM:SS
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default VideoList;
