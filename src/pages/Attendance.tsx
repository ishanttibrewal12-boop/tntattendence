import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface Staff {
  id: string;
  name: string;
  designation: string | null;
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'holiday' | 'sunday' | 'leave';
  notes: string | null;
}

type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'holiday' | 'sunday' | 'leave';

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-chart-1 text-chart-1-foreground',
  absent: 'bg-destructive text-destructive-foreground',
  half_day: 'bg-chart-4 text-chart-4-foreground',
  holiday: 'bg-chart-2 text-chart-2-foreground',
  sunday: 'bg-muted text-muted-foreground',
  leave: 'bg-chart-3 text-chart-3-foreground',
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  holiday: 'Holiday',
  sunday: 'Sunday',
  leave: 'Leave',
};

const Attendance = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch active staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, designation')
        .eq('is_active', true)
        .order('name');

      if (staffError) throw staffError;
      setStaffList(staffData || []);

      // Fetch attendance for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map<string, AttendanceRecord>();
      attendanceData?.forEach((record) => {
        attendanceMap.set(record.staff_id, record as AttendanceRecord);
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const updateAttendance = async (staffId: string, status: AttendanceStatus) => {
    try {
      const existingRecord = attendance.get(staffId);

      if (existingRecord) {
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance').insert([
          {
            staff_id: staffId,
            date: selectedDate,
            status,
          },
        ]);

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Attendance updated' });
      fetchData();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
        variant: 'destructive',
      });
    }
  };

  const markAllAs = async (status: AttendanceStatus) => {
    try {
      const updates = staffList.map((staff) => ({
        staff_id: staff.id,
        date: selectedDate,
        status,
      }));

      // Delete existing records for this date
      await supabase.from('attendance').delete().eq('date', selectedDate);

      // Insert new records
      const { error } = await supabase.from('attendance').insert(updates);

      if (error) throw error;

      toast({ title: 'Success', description: `All staff marked as ${statusLabels[status]}` });
      fetchData();
    } catch (error) {
      console.error('Error marking all:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
        variant: 'destructive',
      });
    }
  };

  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const changeDate = (days: number) => {
    const newDate = addDays(new Date(selectedDate), days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const presentCount = Array.from(attendance.values()).filter(
    (a) => a.status === 'present'
  ).length;
  const absentCount = Array.from(attendance.values()).filter(
    (a) => a.status === 'absent'
  ).length;
  const halfDayCount = Array.from(attendance.values()).filter(
    (a) => a.status === 'half_day'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground">Track daily attendance for your staff</p>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 p-0 w-auto focus-visible:ring-0"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Today
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => markAllAs('present')}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => markAllAs('absent')}>
                Mark All Absent
              </Button>
              <Button variant="outline" size="sm" onClick={() => markAllAs('holiday')}>
                Mark Holiday
              </Button>
              <Button variant="outline" size="sm" onClick={() => markAllAs('sunday')}>
                Mark Sunday
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-foreground">{staffList.length}</div>
            <p className="text-sm text-muted-foreground">Total Staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-chart-1">{presentCount}</div>
            <p className="text-sm text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{absentCount}</div>
            <p className="text-sm text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-chart-4">{halfDayCount}</div>
            <p className="text-sm text-muted-foreground">Half Day</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search staff by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance for {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff found. Add staff members first!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => {
                    const record = attendance.get(staff.id);
                    const currentStatus = record?.status;

                    return (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium">{staff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{staff.designation || '-'}</TableCell>
                        <TableCell>
                          {currentStatus ? (
                            <Badge className={statusColors[currentStatus]}>
                              {statusLabels[currentStatus]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Marked</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentStatus || ''}
                            onValueChange={(value) =>
                              updateAttendance(staff.id, value as AttendanceStatus)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                              <SelectItem value="holiday">Holiday</SelectItem>
                              <SelectItem value="sunday">Sunday</SelectItem>
                              <SelectItem value="leave">Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
