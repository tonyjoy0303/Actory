import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle, Mail, Share2, Edit, Upload, Camera } from 'lucide-react';
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import VideoList from "@/components/profile/VideoList";
import ContactModal from "@/components/ContactModal";
import API from "@/lib/api";

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    location: '',
    socialLinks: {},
    skills: [],
    experienceLevel: ''
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [imageKey, setImageKey] = useState(Date.now());

  const queryClient = useQueryClient();

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

  // Check if current user is the owner
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setIsOwner(user._id === id);
    }
  }, [id]);

  // Set isFollowing based on currentUser's following
  useEffect(() => {
    if (currentUser && profile) {
      setIsFollowing(currentUser.following?.some(f => f._id === id) || false);
    }
  }, [currentUser, profile, id]);

  // Set edit data when profile loads
  useEffect(() => {
    if (profile && isOwner) {
      setEditData({
        bio: profile.bio || '',
        location: profile.location || '',
        socialLinks: profile.socialLinks || {},
        skills: profile.skills || [],
        experienceLevel: profile.experienceLevel || ''
      });
    }
  }, [profile, isOwner]);

  // Update image key when profile changes to force browser cache refresh
  useEffect(() => {
    if (profile) {
      setImageKey(Date.now());
    }
  }, [profile]);

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

      // Update localStorage
      if (currentUser) {
        const updatedUser = { ...currentUser };
        if (!isFollowing) { // after toggle, !isFollowing means we just followed
          updatedUser.following = [...(updatedUser.following || []), { _id: id }];
        } else {
          updatedUser.following = updatedUser.following.filter(f => f._id !== id);
        }
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }

      // Invalidate profile query to refresh follower count
      queryClient.invalidateQueries({ queryKey: ['publicProfile', id] });
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      // Upload profile image if selected
      if (profileImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('photo', profileImageFile);

        const imageResponse = await API.put('/auth/me/photo', imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!imageResponse.data.success) {
          throw new Error('Failed to upload profile image');
        }
      }

      // Update text fields
      const textFormData = new FormData();
      Object.keys(editData).forEach(key => {
        const val = editData[key];
        if (val === null || val === undefined) return;
        // Skip empty strings/objects/arrays to avoid backend enum validations
        if (typeof val === 'string' && val.trim() === '') return;
        if (typeof val === 'object') {
          const isEmptyObj = !Array.isArray(val) && Object.keys(val).length === 0;
          const isEmptyArr = Array.isArray(val) && val.length === 0;
          if (isEmptyObj || isEmptyArr) return;
          textFormData.append(key, JSON.stringify(val));
        } else {
          textFormData.append(key, val);
        }
      });

      const { data } = await API.put('/profile/me', textFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        toast.success('Profile updated successfully!');
        setEditMode(false);
        setProfileImageFile(null);
        setProfileImagePreview(null);
        // Refetch profile
        queryClient.invalidateQueries({ queryKey: ['publicProfile', id] });
        // Update header avatar immediately if current user updated their own profile
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u._id === id) {
              const updated = { ...u, profileImage: data.data?.profileImage || u.profileImage };
              localStorage.setItem('user', JSON.stringify(updated));
              window.dispatchEvent(new Event('authChange'));
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
                <AvatarImage src={profileImagePreview || (profile?.profileImage ? `${profile?.profileImage}?t=${imageKey}` : undefined)} alt={profile?.name} />
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
              {isOwner ? (
                <Button onClick={() => setEditMode(!editMode)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              ) : (
                <>
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
                </>
              )}
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
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="profileImage">Profile Photo</Label>
                      <div className="mt-2">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/25">
                            <AvatarImage src={profileImagePreview || (profile?.profileImage ? `${profile?.profileImage}?t=${imageKey}` : undefined)} alt="Profile preview" />
                            <AvatarFallback>
                              <Camera className="h-6 w-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Input
                              id="profileImage"
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageChange}
                              className="hidden"
                            />
                            <Label htmlFor="profileImage" className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose Photo
                                </span>
                              </Button>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG or GIF. Max size 5MB.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        placeholder="Your location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Input
                        id="experienceLevel"
                        value={editData.experienceLevel}
                        onChange={(e) => setEditData({ ...editData, experienceLevel: e.target.value })}
                        placeholder="e.g. Beginner, Intermediate, Professional"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>Save Changes</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setProfileImageFile(null);
                          setProfileImagePreview(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                  user={currentUser}
                  ownerName={profile?.name}
                  ownerAvatar={profile?.profileImage ? `${profile?.profileImage}?t=${imageKey}` : undefined}
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
        <ContactModal
          recipientId={id}
          recipientName={profile?.name}
          onClose={() => setIsContactModalOpen(false)}
        />
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
