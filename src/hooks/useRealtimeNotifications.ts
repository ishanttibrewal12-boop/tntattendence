import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeNotification {
  id: string;
  type: 'reminder' | 'advance' | 'attendance' | 'vehicle' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio not supported, silently ignore
    }
  }, []);

  const addNotification = useCallback((n: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const notification: RealtimeNotification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    toast.info(n.title, { description: n.message, duration: 4000 });
    playNotificationSound();
  }, [playNotificationSound]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Listen for new reminders
    const remindersChannel = supabase
      .channel('realtime-reminders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reminders' }, (payload) => {
        const data = payload.new as any;
        addNotification({
          type: 'reminder',
          title: '🔔 New Reminder',
          message: data.title || 'A new reminder was created',
        });
      })
      .subscribe();

    // Listen for new advances
    const advancesChannel = supabase
      .channel('realtime-advances')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'advances' }, (payload) => {
        const data = payload.new as any;
        addNotification({
          type: 'advance',
          title: '💰 New Advance Request',
          message: `₹${Number(data.amount).toLocaleString()} advance recorded`,
        });
      })
      .subscribe();

    // Listen for MLT advances
    const mltAdvancesChannel = supabase
      .channel('realtime-mlt-advances')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mlt_advances' }, (payload) => {
        const data = payload.new as any;
        addNotification({
          type: 'advance',
          title: '💰 MLT Advance Request',
          message: `₹${Number(data.amount).toLocaleString()} MLT advance recorded`,
        });
      })
      .subscribe();

    // Listen for vehicle maintenance
    const vehicleChannel = supabase
      .channel('realtime-vehicle-maintenance')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_maintenance' }, (payload) => {
        const data = payload.new as any;
        addNotification({
          type: 'vehicle',
          title: '🚛 Vehicle Maintenance',
          message: `${data.maintenance_type} maintenance recorded - ₹${Number(data.cost).toLocaleString()}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(remindersChannel);
      supabase.removeChannel(advancesChannel);
      supabase.removeChannel(mltAdvancesChannel);
      supabase.removeChannel(vehicleChannel);
    };
  }, [addNotification]);

  return { notifications, unreadCount, markAsRead, markAllRead };
}
