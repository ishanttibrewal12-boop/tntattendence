import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Bell, Calendar as CalendarIcon, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  reminder_date: string;
  reminder_time: string;
  is_sent: boolean;
}

interface RemindersSectionProps {
  onBack: () => void;
}

const RemindersSection = ({ onBack }: RemindersSectionProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [deleteConfirm, setDeleteConfirm] = useState<Reminder | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true });

    if (data) setReminders(data);
    if (error) toast.error('Failed to load reminders');
    setIsLoading(false);
  };

  const addReminder = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const { error } = await supabase.from('reminders').insert({
      title: title.trim(),
      message: message.trim() || null,
      reminder_date: format(selectedDate, 'yyyy-MM-dd'),
      reminder_time: selectedTime,
    });

    if (error) {
      toast.error('Failed to add reminder');
      return;
    }

    toast.success('Reminder added');
    setDialogOpen(false);
    resetForm();
    fetchReminders();
  };

  const deleteReminder = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase.from('reminders').delete().eq('id', deleteConfirm.id);
    if (error) {
      toast.error('Failed to delete reminder');
      return;
    }

    toast.success('Reminder deleted');
    setDeleteConfirm(null);
    fetchReminders();
  };

  const shareReminder = (reminder: Reminder) => {
    let message = `🔔 *Reminder*\n\n`;
    message += `*${reminder.title}*\n`;
    if (reminder.message) {
      message += `${reminder.message}\n`;
    }
    message += `\n📅 ${format(new Date(reminder.reminder_date), 'dd MMM yyyy')}`;
    message += ` at ${reminder.reminder_time}\n\n`;
    message += `_Tibrewal Staff Manager_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setSelectedDate(new Date());
    setSelectedTime('09:00');
  };

  const upcomingReminders = reminders.filter(r => isFuture(new Date(r.reminder_date)) || isToday(new Date(r.reminder_date)));
  const pastReminders = reminders.filter(r => isPast(new Date(r.reminder_date)) && !isToday(new Date(r.reminder_date)));

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Reminders</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Reminder title..."
                />
              </div>

              <div>
                <Label>Message (Optional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Additional details..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'dd MMM')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) setSelectedDate(date);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={addReminder} className="w-full">
                Add Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No reminders yet</p>
          <p className="text-sm">Add reminders to stay on track</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h2>
              <div className="space-y-2">
                {upcomingReminders.map((reminder) => (
                  <Card key={reminder.id} className={isToday(new Date(reminder.reminder_date)) ? 'border-primary' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{reminder.title}</p>
                          {reminder.message && (
                            <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(reminder.reminder_date), 'dd MMM yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reminder.reminder_time}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => shareReminder(reminder)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirm(reminder)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {isToday(new Date(reminder.reminder_date)) && (
                        <div className="mt-2 text-xs text-primary font-medium">📢 Today</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Reminders */}
          {pastReminders.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Past</h2>
              <div className="space-y-2">
                {pastReminders.map((reminder) => (
                  <Card key={reminder.id} className="opacity-60">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{reminder.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(reminder.reminder_date), 'dd MMM yyyy')}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteConfirm(reminder)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReminder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RemindersSection;
