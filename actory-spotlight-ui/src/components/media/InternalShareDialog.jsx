import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import API from '@/lib/api';
import { toast } from 'sonner';

const mapProfileToUser = (profile) => ({
  _id: profile?._id,
  name: profile?.name || profile?.companyName || 'Unknown User',
  profileImage: profile?.profileImage || profile?.photo || '',
  role: profile?.role || 'User'
});

const normalizeFollowingIds = (following) => {
  if (!Array.isArray(following)) return [];

  const ids = following
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry;
      return entry._id || entry.id || null;
    })
    .filter(Boolean);

  return Array.from(new Set(ids.map(String)));
};

export default function InternalShareDialog({
  open,
  onOpenChange,
  media,
  currentUser,
}) {
  const [followedUsers, setFollowedUsers] = useState([]);
  const [resolvedFollowingIds, setResolvedFollowingIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingToUserId, setSendingToUserId] = useState(null);

  const currentUserId = currentUser?._id || currentUser?.id || '';
  const followingIdsFromUser = useMemo(() => normalizeFollowingIds(currentUser?.following), [currentUser?.following]);

  useEffect(() => {
    setResolvedFollowingIds(followingIdsFromUser);
  }, [followingIdsFromUser]);

  useEffect(() => {
    if (!open || !currentUserId || followingIdsFromUser.length > 0) return;

    const loadCurrentProfileFollowing = async () => {
      try {
        const { data } = await API.get('/profile/me');
        setResolvedFollowingIds(normalizeFollowingIds(data?.following));
      } catch (error) {
        console.error('Failed to load following list for sharing:', error);
        setResolvedFollowingIds([]);
      }
    };

    loadCurrentProfileFollowing();
  }, [open, currentUserId, followingIdsFromUser.length]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSearchResults([]);
      setSendingToUserId(null);
      return;
    }

    if (resolvedFollowingIds.length === 0) {
      setFollowedUsers([]);
      return;
    }

    const loadFollowedUsers = async () => {
      setLoadingFollowed(true);
      try {
        const responses = await Promise.allSettled(
          resolvedFollowingIds.map((id) => API.get(`/profile/${id}`))
        );

        const users = responses
          .filter((response) => response.status === 'fulfilled')
          .map((response) => mapProfileToUser(response.value?.data))
          .filter((user) => user?._id && String(user._id) !== String(currentUserId));

        const uniqueUsers = Array.from(
          new Map(users.map((user) => [String(user._id), user])).values()
        );

        setFollowedUsers(uniqueUsers);
      } catch (error) {
        console.error('Failed to load followed users for sharing:', error);
        setFollowedUsers([]);
      } finally {
        setLoadingFollowed(false);
      }
    };

    loadFollowedUsers();
  }, [open, resolvedFollowingIds, currentUserId]);

  useEffect(() => {
    if (!open) return;

    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data } = await API.get('/profile/search', {
          params: { username: term }
        });

        const users = (data?.data || [])
          .map(mapProfileToUser)
          .filter((user) => user?._id && String(user._id) !== String(currentUserId));

        const uniqueUsers = Array.from(
          new Map(users.map((user) => [String(user._id), user])).values()
        );

        setSearchResults(uniqueUsers);
      } catch (error) {
        console.error('User search failed while sharing media:', error);
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, open, currentUserId]);

  const recipientList = searchTerm.trim() ? searchResults : followedUsers;

  const handleSend = async (recipient) => {
    if (!recipient?._id || !media) return;

    const mediaTitle = media.title || media.description || 'Media post';
    const messageContent = `[[ACTORY_SHARE]]${JSON.stringify({
      type: 'media-share',
      title: mediaTitle,
      url: media.shareUrl || '',
      thumbnailUrl: media.thumbnailUrl || media.shareUrl || '',
      mediaType: media.mediaType || 'media',
      mediaId: media.id || null,
    })}`;

    try {
      setSendingToUserId(recipient._id);
      const { data } = await API.post('/messages', {
        recipientId: recipient._id,
        content: messageContent
      });

      if (data?.success) {
        toast.success(`Shared with ${recipient.name}`);
        onOpenChange(false);
      } else {
        toast.error('Could not share media right now');
      }
    } catch (error) {
      console.error('Failed to send shared media message:', error);
      toast.error(error?.response?.data?.message || 'Failed to share media');
    } finally {
      setSendingToUserId(null);
    }
  };

  const isFollowing = (userId) => resolvedFollowingIds.includes(String(userId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Share In Actory</DialogTitle>
          <DialogDescription>
            By default, you see people you follow. Search by name to share with non-followers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name"
          />

          <div className="max-h-72 overflow-y-auto space-y-2">
            {loadingFollowed && !searchTerm.trim() ? (
              <p className="text-sm text-muted-foreground">Loading followed users...</p>
            ) : null}

            {searchingUsers && searchTerm.trim() ? (
              <p className="text-sm text-muted-foreground">Searching users...</p>
            ) : null}

            {!loadingFollowed && !searchingUsers && recipientList.length === 0 && !searchTerm.trim() ? (
              <p className="text-sm text-muted-foreground">You are not following anyone yet. Search by name to share.</p>
            ) : null}

            {!loadingFollowed && !searchingUsers && recipientList.length === 0 && searchTerm.trim() ? (
              <p className="text-sm text-muted-foreground">No users found for this search.</p>
            ) : null}

            {recipientList.map((recipient) => (
              <div
                key={recipient._id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={recipient.profileImage} alt={recipient.name} />
                    <AvatarFallback>
                      {recipient.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{recipient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {recipient.role}
                      {isFollowing(recipient._id) ? ' • Following' : ' • Not followed'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleSend(recipient)}
                  disabled={sendingToUserId === recipient._id}
                >
                  {sendingToUserId === recipient._id ? 'Sending...' : 'Share'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
