import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketNotifications } from './useSocketNotifications';
import API from '@/lib/api';

const fetchNotifications = async () => {
  const { data } = await API.get('/notifications', { params: { limit: 20, page: 1 } });
  if (!data.success) throw new Error('Failed to fetch notifications');
  return data;
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const addRealtime = useCallback((incoming) => {
    queryClient.setQueryData(['notifications'], (prev) => {
      if (!prev) return { success: true, data: [incoming], meta: { unreadCount: incoming.isRead ? 0 : 1, total: 1, page: 1, limit: 20 } };
      const data = [incoming, ...prev.data].slice(0, 20);
      const meta = {
        ...prev.meta,
        unreadCount: (prev.meta?.unreadCount || 0) + (incoming.isRead ? 0 : 1)
      };
      return { ...prev, data, meta };
    });
  }, [queryClient]);

  useSocketNotifications({ onNotification: addRealtime });

  const markOne = useMutation({
    mutationFn: async (id) => {
      const { data } = await API.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { data } = await API.patch('/notifications/mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.meta?.unreadCount || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    markOne: markOne.mutateAsync,
    markAll: markAll.mutateAsync,
  };
}
