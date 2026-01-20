import { useState, useEffect } from 'react';
import { Users, Wallet, Calendar, TrendingUp, ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  onBack: () => void;
}

const Dashboard = ({ onBack }: DashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [stats, setStats] = useState({
    totalStaff: 0,
    petroleumStaff: 0,
    crusherStaff: 0,
    pendingAdvances: 0,
    totalSalary: 0,
    totalShifts: 0,
  });

  const [attendanceChart, setAttendanceChart] = useState<{ name: string; shifts: number }[]>([]);
  const [categoryChart, setCategoryChart] = useState<{ name: string; value: number }[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))'];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    const [staffRes, advancesRes, attendanceRes, payrollRes] = await Promise.all([
      supabase.from('staff').select('id, category').eq('is_active', true),
      supabase.from('advances').select('amount').eq('is_deducted', false),
      supabase.from('attendance').select('staff_id, status, shift_count, date').gte('date', startDate).lte('date', endDate),
      supabase.from('payroll').select('net_salary').eq('month', selectedMonth).eq('year', selectedYear),
    ]);

    const staff = staffRes.data || [];
    const petroleumCount = staff.filter(s => s.category === 'petroleum').length;
    const crusherCount = staff.filter(s => s.category === 'crusher').length;

    const pendingAdvances = (advancesRes.data || []).reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSalary = (payrollRes.data || []).reduce((sum, p) => sum + Number(p.net_salary), 0);

    const attendance = attendanceRes.data || [];
    const totalShifts = attendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);

    // Build weekly chart data
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const weeklyData: { name: string; shifts: number }[] = [];
    
    for (let week = 1; week <= 5; week++) {
      const startDay = (week - 1) * 7 + 1;
      const endDay = Math.min(week * 7, daysInMonth);
      
      const weekShifts = attendance
        .filter(a => {
          const day = parseInt(a.date.split('-')[2]);
          return day >= startDay && day <= endDay;
        })
        .reduce((sum, a) => sum + (a.shift_count || 1), 0);
      
      weeklyData.push({ name: `Week ${week}`, shifts: weekShifts });
    }

    setAttendanceChart(weeklyData.filter(w => w.shifts > 0));
    setCategoryChart([
      { name: 'Petroleum', value: petroleumCount },
      { name: 'Crusher', value: crusherCount },
    ]);

    setStats({
      totalStaff: staff.length,
      petroleumStaff: petroleumCount,
      crusherStaff: crusherCount,
      pendingAdvances,
      totalSalary,
      totalShifts,
    });

    setIsLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalStaff}</p>
                    <p className="text-xs text-muted-foreground">Total Staff</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Wallet className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">₹{stats.pendingAdvances.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Pending Advances</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">₹{stats.totalSalary.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Monthly Salary</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalShifts}</p>
                    <p className="text-xs text-muted-foreground">Total Shifts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Distribution Chart */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Shifts Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Weekly Shifts - {months[selectedMonth - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="shifts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
