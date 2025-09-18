import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle, Mail, Share2 } from 'lucide-react';
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import VideoList from "@/components/profile/VideoList";
import API from "@/lib/api";

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch actor profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicProfile', id],
    queryFn: async () => {
      const { data } = await API.get(`/profile/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Set share URL when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await API.delete(`/profile/${id}/unfollow`);
        toast.success(`Unfollowed ${profile?.name}`);
      } else {
        await API.post(`/profile/${id}/follow`);
        toast.success(`Following ${profile?.name}`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name}'s Profile | Actory`,
          text: `Check out ${profile?.name}'s profile on Actory`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/3 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex space-x-4 w-full justify-center">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:w-2/3 space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  // Calculate age from date of birth if available
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${profile?.name || 'Actor'} | Actory`}
        description={profile?.bio || `View ${profile?.name}'s profile on Actory`}
        image={profile?.profileImage}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center space-x-6">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile?.profileImage} alt={profile?.name} />
                <AvatarFallback className="text-4xl">
                  {profile?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold">{profile?.name}</h1>
                  {profile?.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {profile?.role === 'Actor' ? 'Actor' : 'Performer'}
                  {profile?.location && ` • ${profile.location}`}
                  {profile?.age && ` • ${profile.age} years old`}
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  {profile?.socialLinks?.facebook && (
                    <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  )}
                  {profile?.socialLinks?.instagram && (
                    <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  )}
                  {profile?.socialLinks?.twitter && (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  )}
                  {profile?.socialLinks?.youtube && (
                    <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => setIsContactModalOpen(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button variant="secondary" onClick={handleFollow}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/3 space-y-6">
            {/* About Card */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.bio ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No bio available
                  </p>
                )}
                
                <Separator className="my-2" />
                
                <div className="space-y-2">
                  {profile?.gender && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Gender:</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {profile.gender}
                      </span>
                    </div>
                  )}
                  
                  {profile?.age && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Age:</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.age} years
                      </span>
                    </div>
                  )}
                  
                  {profile?.location && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Location:</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.location}
                      </span>
                    </div>
                  )}
                  
                  {profile?.experienceLevel && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Experience:</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {profile.experienceLevel}
                      </span>
                    </div>
                  )}
                  
                  {profile?.joinedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Member since:</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(profile.joinedAt), 'MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Skills Card */}
            {profile?.skills?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.videoCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.followerCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.viewCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.submissionCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:w-2/3 space-y-6">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
              </TabsList>
              
              <TabsContent value="videos" className="space-y-6">
                <VideoList 
                  videos={profile?.videos || []} 
                  isOwner={false}
                />
              </TabsContent>
              
              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile?.bio ? (
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{profile.bio}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No biography available.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Add more sections like training, education, etc. */}
              </TabsContent>
              
              <TabsContent value="experience" className="space-y-6">
                {profile?.experience?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{exp.role}</CardTitle>
                              <CardDescription>{exp.company}</CardDescription>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {exp.startDate && format(new Date(exp.startDate), 'MMM yyyy')}
                              {exp.endDate ? ` - ${format(new Date(exp.endDate), 'MMM yyyy')}` : ' - Present'}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{exp.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No experience added yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {profile?.name}</DialogTitle>
            <DialogDescription>
              Send a message to {profile?.name} through Actory's messaging system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Your Message
              </label>
              <textarea
                id="message"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>
              Cancel
            </Button>
            <Button>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Profile</DialogTitle>
            <DialogDescription>
              Share {profile?.name}'s profile with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>
            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" size="icon">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
