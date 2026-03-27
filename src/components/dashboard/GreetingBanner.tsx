import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, CloudSun, Clock, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface GreetingBannerProps {
  userName: string;
}

const GreetingBanner = ({ userName }: GreetingBannerProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchReminders = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count } = await supabase.from('reminders').select('*', { count: 'exact', head: true })
        .eq('reminder_date', today).eq('is_sent', false);
      setReminderCount(count || 0);
    };
    fetchReminders();
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const GreetIcon = hour < 12 ? Sun : hour < 17 ? CloudSun : Moon;

  return (
    <motion.div
      className="flex items-center justify-between flex-wrap gap-3 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(234,136,37,0.1)' }}>
          <GreetIcon className="h-5 w-5" style={{ color: 'hsl(28, 88%, 52%)' }} />
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-primary-foreground tracking-tight">
            {greeting}, {userName?.split(' ')[0] || 'Admin'}
          </h2>
          <p className="text-[11px] text-primary-foreground/40 font-medium flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {format(currentTime, 'EEEE, dd MMMM yyyy · hh:mm a')}
          </p>
        </div>
      </div>
      {reminderCount > 0 && (
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(234,136,37,0.1)', border: '1px solid rgba(234,136,37,0.15)' }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Bell className="h-3.5 w-3.5" style={{ color: 'hsl(28, 88%, 52%)' }} />
          <span className="text-xs font-bold" style={{ color: 'hsl(28, 88%, 55%)' }}>
            {reminderCount} reminder{reminderCount > 1 ? 's' : ''} today
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GreetingBanner;
