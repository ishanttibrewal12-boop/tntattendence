import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, IndianRupee, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  presentToday: number;
  totalPayrollThisMonth: number;
}

const Dashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    activeStaff: 0,
    presentToday: 0,
    totalPayrollThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch staff count
        const { count: totalStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true });

        const { count: activeStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { count: presentToday } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .in('status', ['present', 'half_day']);

        // Fetch this month's payroll
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const { data: payrollData } = await supabase
          .from('payroll')
          .select('net_salary')
          .eq('month', currentMonth)
          .eq('year', currentYear);

        const totalPayroll = payrollData?.reduce((sum, p) => sum + Number(p.net_salary), 0) || 0;

        setStats({
          totalStaff: totalStaff || 0,
          activeStaff: activeStaff || 0,
          presentToday: presentToday || 0,
          totalPayrollThisMonth: totalPayroll,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Staff',
      value: stats.totalStaff,
      description: 'Registered workers',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Staff',
      value: stats.activeStaff,
      description: 'Currently working',
      icon: UserCheck,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      description: 'Attendance marked',
      icon: Calendar,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      title: 'Monthly Payroll',
      value: `₹${stats.totalPayrollThisMonth.toLocaleString('en-IN')}`,
      description: 'This month total',
      icon: IndianRupee,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {admin?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your staff and payroll
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? '...' : stat.value}
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Company Info Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Tibrewal & Tibrewal Private Limited</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="font-medium text-foreground">Mining & Construction</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">
                Tibrewal Tyres, Gunia Mahagama, Jharkhand 814154
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium text-foreground">+91 9386469006</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">IshantTibrewal12@gmail.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
