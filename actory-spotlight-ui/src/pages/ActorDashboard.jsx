import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Video, Upload as UploadIcon, PlayCircle, MessageCircle } from "lucide-react";
import VideoUploadForm from "@/components/profile/VideoUploadForm";
import VideoList from "@/components/profile/VideoList";

// Define types

const VideoModal = ({ videoUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
          aria-label="Close video"
        >
          ✕
        </button>
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          className="w-full h-full max-h-[80vh] rounded-lg"
        />
      </div>
    </div>
  );
};

// Simple MP4 Video Player with better logging and error handling
const VideoPlayerModal = ({ video, onClose }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!video) {
      setHasError(true);
      setErrorMessage('No video data provided');
      return;
    }

    // Check for video URL in different possible properties
    const url = video.videoUrl || video.url || video.video?.url;
    
    if (!url) {
      console.error('No video URL found in video object:', video);
      setHasError(true);
      setErrorMessage('No video URL found');
      return;
    }

    setVideoUrl(url);
    console.log('Video URL:', url);
    
    if (videoRef.current) {
      const videoEl = videoRef.current;
      
      // Reset state
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
      
      // Set up event listeners
      const handleCanPlay = () => {
        console.log('Video can play');
        setIsLoading(false);
      };
      
      const handleError = (e) => {
        console.error('Video error:', e);
        console.error('Video error details:', videoEl.error);
        setHasError(true);
        setIsLoading(false);
        
        if (videoEl.error) {
          switch(videoEl.error.code) {
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              setErrorMessage('The video format is not supported by your browser.');
              break;
            case MediaError.MEDIA_ERR_ABORTED:
              setErrorMessage('Video playback was aborted.');
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              setErrorMessage('A network error occurred while loading the video.');
              break;
            case MediaError.MEDIA_ERR_DECODE:
              setErrorMessage('Error decoding the video.');
              break;
            default:
              setErrorMessage('An error occurred while loading the video.');
          }
        } else {
          setErrorMessage('Failed to load video. Please check the URL and try again.');
        }
      };
      
      const handleLoadStart = () => {
        console.log('Video load started');
        setIsLoading(true);
      };
      
      videoEl.addEventListener('canplay', handleCanPlay);
      videoEl.addEventListener('error', handleError);
      videoEl.addEventListener('loadstart', handleLoadStart);
      
      // Set source with a small delay
      setTimeout(() => {
        if (videoEl) {
          videoEl.src = url;
          videoEl.load();
        }
      }, 100);
      
      // Cleanup
      return () => {
        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
          videoEl.removeEventListener('canplay', handleCanPlay);
          videoEl.removeEventListener('error', handleError);
          videoEl.removeEventListener('loadstart', handleLoadStart);
        }
      };
    }
  }, [video]);

  if (!video) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <p className="text-xl font-medium">No video selected</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl z-10"
          aria-label="Close video player"
        >
          ✕
        </button>
        
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-white">Loading video...</p>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
              <p className="text-xl font-medium mb-2">Error Loading Video</p>
              <p className="text-gray-300 mb-4">{errorMessage || 'Please try again later.'}</p>
              {videoUrl && (
                <button 
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                >
                  Open Video in New Tab
                </button>
              )}
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              className="absolute top-0 left-0 w-full h-full"
              style={{ display: isLoading ? 'none' : 'block' }}
              onClick={e => e.stopPropagation()}
              preload="metadata"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        
        <div className="mt-4 text-white">
          <h3 className="text-xl font-bold">{video.title || 'Video'}</h3>
          {video.description && (
            <p className="mt-2 text-gray-300">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ActorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [castingCalls, setCastingCalls] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const videoRef = useRef(null);

  // Fetch user profile and videos
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/profile/me');
      setUser(data);
      setVideos(data.videos || []);
      
      // Fetch casting calls and submissions if needed
      await Promise.all([
        fetchCastingCalls(),
        fetchSubmissions()
      ]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCastingCalls = async () => {
    try {
      const { data } = await API.get('/casting');
      setCastingCalls(data.data || []);
    } catch (error) {
      console.error('Error fetching casting calls:', error);
      toast.error('Failed to load casting calls');
    }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      console.log('Fetching submissions...');
      
      // Make the API call
      const { data } = await API.get('/videos/mine');
      console.log('API Response:', data);
      
      // Process submissions to include casting call titles
      const submissionsWithDetails = (data.data || []).map(submission => {
        // Default title
        let displayTitle = 'Untitled Casting Call';
        
        // Check if we have a casting call with roleTitle
        if (submission.castingCall?.roleTitle) {
          displayTitle = submission.castingCall.roleTitle;
        } 
        // Fallback to submission title if available
        else if (submission.title) {
          displayTitle = submission.title;
        }
        
        return {
          ...submission,
          displayTitle
        };
      });
      
      console.log('Processed submissions:', submissionsWithDetails);
      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (showVideoPlayer && playingVideo && videoRef.current) {
      const video = videoRef.current;
      
      // Set up the video source
      const source = document.createElement('source');
      source.src = playingVideo.videoUrl;
      source.type = 'video/mp4';
      
      // Clear any existing sources
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      
      video.appendChild(source);
      
      // Mute the video to help with autoplay restrictions
      video.muted = true;
      
      // Try to play the video
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay prevented:', error);
          // Show a play button if autoplay is prevented
          const playButton = document.createElement('button');
          playButton.textContent = 'Click to Play';
          playButton.className = 'absolute inset-0 m-auto bg-black/70 text-white px-4 py-2 rounded-lg';
          playButton.onclick = (e) => {
            e.stopPropagation();
            video.muted = false;
            video.play().catch(console.error);
            playButton.remove();
          };
          video.parentNode.appendChild(playButton);
        });
      }
      
      // Cleanup function
      return () => {
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      };
    }
  }, [showVideoPlayer, playingVideo]);

  const handleVideoUploaded = (newVideo) => {
    setVideos(prevVideos => [newVideo, ...prevVideos]);
    setShowUploadForm(false);
  };

  const handleVideoDeleted = (deletedVideoId) => {
    setVideos(prevVideos => prevVideos.filter(video => video._id !== deletedVideoId));
  };

  const handleVideoPlay = (video) => {
    setPlayingVideo(video);
    // Use a small delay to ensure the modal is in the DOM
    setTimeout(() => {
      setShowVideoPlayer(true);
    }, 100);
  };

  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    // Small delay before clearing the video to allow for smooth transition
    setTimeout(() => {
      setPlayingVideo(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Actor Dashboard | Actory" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Actor'}</h1>
          <p className="text-muted-foreground">Manage your profile, videos, and submissions</p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            My Videos
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Bell className="h-4 w-4 mr-2" />
            My Submissions
            {submissions.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {submissions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          {showUploadForm ? (
            <Card>
              <CardContent className="pt-6">
                <VideoUploadForm 
                  onUploadSuccess={handleVideoUploaded}
                  onCancel={() => setShowUploadForm(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">My Videos</h2>
                <Button onClick={() => setShowUploadForm(true)}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Showcase Your Skills
                </Button>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <VideoList
                    videos={videos}
                    user={user}
                    onVideoPlay={handleVideoPlay}
                    onVideoDeleted={handleVideoDeleted}
                    ownerName={user?.name}
                    ownerAvatar={user?.profileImage}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>
                Track your audition submissions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't made any submissions yet.</p>
                  <Button className="mt-4" onClick={() => navigate('/casting')}>
                    Browse Casting Calls
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission._id} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium text-lg">
                              {submission.displayTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted on {new Date(submission.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              submission.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                              submission.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleVideoPlay({ ...submission, title: submission.displayTitle })}
                            >
                              <PlayCircle className="h-4 w-4" />
                              View Video
                            </Button>
                          </div>
                        </div>
                        {submission.comments && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Note:</span> {submission.comments}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                Chat with producers and other actors. Connect and communicate directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Access your messages to connect with producers and other actors.
                </p>
                <Button onClick={() => navigate('/messages')}>
                  Open Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {playingVideo && (
        <VideoPlayerModal 
          video={playingVideo} 
          onClose={closeVideoPlayer} 
        />
      )}
    </div>
  );
}

// Helper function for submission status badge variants
function getStatusBadgeVariant(status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'reviewing':
      return 'default';
    case 'shortlisted':
      return 'default';
    case 'accepted':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}
