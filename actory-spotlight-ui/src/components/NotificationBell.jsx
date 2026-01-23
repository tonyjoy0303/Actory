import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import API from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationBell() {
  const { notifications, unreadCount, isLoading, markOne, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const queryClient = useQueryClient();

  const containerRef = React.useRef(null);

  const handleToggle = () => setOpen((o) => !o);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (open && unreadCount > 0) {
      console.log('Opening bell, triggering markAll. Unread:', unreadCount);
      markAll().then(res => {
        console.log('Mark all response:', res);
        if (res.data && res.data.matched === 0) {
          toast.error(`Debug: No matching notifications found for User ID`);
        }
      }).catch(err => console.error('Auto-mark-all failed', err));
    }
  }, [open, unreadCount, markAll]);

  const handleAccept = async (e, notification) => {
    e.stopPropagation();
    try {
      setProcessing(notification._id);
      const { data } = await API.post('/team-invitations/accept', { invitationId: notification.relatedId?._id || notification.relatedId });
      if (data.success) {
        toast.success('Invitation accepted');
        // Refresh notifications to get updated status (pending -> accepted)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (e, notification) => {
    e.stopPropagation();
    try {
      setProcessing(notification._id);
      const { data } = await API.post('/team-invitations/reject', { invitationId: notification.relatedId?._id || notification.relatedId });
      if (data.success) {
        toast.info('Invitation rejected');
        // Refresh notifications to get updated status
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button variant="ghost" size="icon" onClick={handleToggle} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-background shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-sm font-medium">Notifications</p>
            <Button
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0 || isLoading}
              onClick={() => markAll()}
            >
              Mark all read
            </Button>
          </div>
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading...</div>}
          {!isLoading && notifications.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No notifications yet</div>
          )}
          {!isLoading && notifications.length > 0 && (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n._id} className="px-3 py-2 flex flex-col items-start gap-2">
                  <div className="flex items-start gap-2 w-full">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${n.isRead ? 'bg-gray-300' : 'bg-green-500'} shrink-0`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => markOne(n._id)}
                        className="h-auto p-0"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                  {/* Actions for Invites: Show only if Pending */}
                  {n.type === 'invite' &&
                    n.relatedType === 'team-invitation' &&
                    n.relatedId?.status === 'pending' && (
                      <div className="pl-4 flex gap-2 mt-1 w-full justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => handleReject(e, n)}
                          disabled={processing === n._id}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => handleAccept(e, n)}
                          disabled={processing === n._id}
                        >
                          Accept
                        </Button>
                      </div>
                    )}
                  {/* Show status if accepted/rejected */}
                  {n.relatedType === 'team-invitation' && n.relatedId?.status !== 'pending' && n.relatedId?.status && (
                    <div className="pl-4 mt-1 w-full text-right">
                      <span className="text-xs text-muted-foreground capitalize">
                        {n.relatedId.status}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
