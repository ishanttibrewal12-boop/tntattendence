import { useState, useMemo, lazy, Suspense, useEffect, useCallback } from 'react';
import { Calendar, Wallet, UserPlus, CalendarDays, Upload, User, UserCog, Settings, FileText, Calculator, Image, Bell, Fuel, FolderArchive, CheckCircle, DollarSign, BarChart3, LogOut, Truck, CircleDot, CreditCard, ChevronRight, Users, Clock, Wrench, LayoutDashboard, Menu, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/contexts/AppAuthContext';
import companyLogo from '@/assets/company-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import AIChatBot from '@/components/AIChatBot';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load sections for performance
const AttendanceSection = lazy(() => import('@/components/sections/AttendanceSection'));
const AdvanceSalarySection = lazy(() => import('@/components/sections/AdvanceSalarySection'));
const StaffSection = lazy(() => import('@/components/sections/StaffSection'));
const StaffDetailsSection = lazy(() => import('@/components/sections/StaffDetailsSection'));
const MonthlyCalendarSection = lazy(() => import('@/components/sections/MonthlyCalendarSection'));
const BulkImportSection = lazy(() => import('@/components/sections/BulkImportSection'));
const StaffProfileSection = lazy(() => import('@/components/sections/StaffProfileSection'));
const SettingsSection = lazy(() => import('@/components/sections/SettingsSection'));
const DailyReportSection = lazy(() => import('@/components/sections/DailyReportSection'));
const CalculatorSection = lazy(() => import('@/components/sections/CalculatorSection'));
const PhotoGallerySection = lazy(() => import('@/components/sections/PhotoGallerySection'));
const RemindersSection = lazy(() => import('@/components/sections/RemindersSection'));
const MLTSection = lazy(() => import('@/components/sections/MLTSection'));
const PetroleumSalesSection = lazy(() => import('@/components/sections/PetroleumSalesSection'));
const BackupSection = lazy(() => import('@/components/sections/BackupSection'));
const PaymentDeductionSection = lazy(() => import('@/components/sections/PaymentDeductionSection'));
const SalarySection = lazy(() => import('@/components/sections/SalarySection'));
const YearlyDataSection = lazy(() => import('@/components/sections/YearlyDataSection'));
const TyreSalesSection = lazy(() => import('@/components/sections/TyreSalesSection'));
const CreditPartiesSection = lazy(() => import('@/components/sections/CreditPartiesSection'));
const CrusherReportsSection = lazy(() => import('@/components/sections/CrusherReportsSection'));
const MLTServicesSection = lazy(() => import('@/components/sections/MLTServicesSection'));
const MLTFuelReportSection = lazy(() => import('@/components/sections/MLTFuelReportSection'));
const UserManagementSection = lazy(() => import('@/components/sections/UserManagementSection'));
const VehicleManagementSection = lazy(() => import('@/components/sections/VehicleManagementSection'));
const InvoiceGeneratorSection = lazy(() => import('@/components/sections/InvoiceGeneratorSection'));
const CrusherFuelAnalysisSection = lazy(() => import('@/components/sections/CrusherFuelAnalysisSection'));

type SectionType = 'attendance' | 'advance-salary' | 'staff' | 'staff-details' | 'monthly-calendar' | 'bulk-import' | 'staff-profile' | 'settings' | 'daily-report' | 'calculator' | 'photo-gallery' | 'reminders' | 'mlt' | 'petroleum-sales' | 'backup' | 'paid-deducted' | 'salary' | 'yearly-data' | 'tyre-sales' | 'credit-parties' | 'crusher-reports' | 'mlt-services' | 'mlt-fuel-report' | 'user-management' | 'vehicle-management' | 'invoice-generator' | 'crusher-fuel-analysis' | null;

type DepartmentType = 'petroleum' | 'crusher' | 'mlt' | 'tyres-office' | 'credit-parties' | 'crusher-reports' | null;

type StaffCategory = 'petroleum' | 'crusher' | 'office';

const getDeptCategory = (dept: DepartmentType): StaffCategory | undefined => {
  if (dept === 'petroleum') return 'petroleum';
  if (dept === 'crusher') return 'crusher';
  if (dept === 'tyres-office') return 'office';
  return undefined;
};

const getDeptTitle = (dept: DepartmentType): string => {
  if (dept === 'petroleum') return 'Petroleum';
  if (dept === 'crusher') return 'Crusher';
  if (dept === 'mlt') return 'MLT';
  if (dept === 'tyres-office') return 'Tyres & Office';
  return '';
};

interface NavItem {
  id: SectionType;
  title: string;
  icon: typeof Calendar;
  description: string;
  primary?: boolean;
}

const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`} />
);

const LoadingFallback = () => (
  <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
    <SkeletonPulse className="h-8 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border">
          <CardContent className="p-4 space-y-3">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-6 w-full" />
            <SkeletonPulse className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
    <SkeletonPulse className="h-64 w-full rounded-lg" />
  </div>
);

// --- KPI Cards Component ---
const KpiCards = () => {
  const [stats, setStats] = useState({ totalStaff: 0, todayPresent: 0, pendingAdvances: 0, monthlyExpense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [staffRes, attendanceRes, advancesRes] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).in('status', ['present', 'half_day']),
        supabase.from('advances').select('amount').eq('is_deducted', false),
      ]);
      const pendingAdv = (advancesRes.data || []).reduce((s, a) => s + Number(a.amount), 0);
      setStats({
        totalStaff: staffRes.count || 0,
        todayPresent: attendanceRes.count || 0,
        pendingAdvances: pendingAdv,
        monthlyExpense: 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: 'Total Staff', value: stats.totalStaff.toString(), icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Today Attendance', value: stats.todayPresent.toString(), icon: Calendar, color: 'bg-accent/10 text-accent' },
    { label: 'Pending Advances', value: `₹${stats.pendingAdvances.toLocaleString('en-IN')}`, icon: Wallet, color: 'bg-destructive/10 text-destructive' },
    { label: 'Monthly Salary', value: '₹0', icon: DollarSign, color: 'bg-chart-1/10 text-chart-1' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4 space-y-3">
              <SkeletonPulse className="h-3 w-20" />
              <SkeletonPulse className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// --- Sidebar Navigation Item ---
interface SidebarNavItemProps {
  icon: typeof Calendar;
  label: string;
  active?: boolean;
  onClick: () => void;
  indent?: boolean;
}

const SidebarNavItem = ({ icon: Icon, label, active, onClick, indent }: SidebarNavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      indent ? 'pl-9' : ''
    } ${
      active
        ? 'bg-sidebar-accent text-sidebar-primary'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    }`}
  >
    <Icon className="h-4 w-4 flex-shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

const Home = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAppAuth();
  const isMobile = useIsMobile();

  const isManager = user?.role === 'manager';
  const isMltAdmin = user?.role === 'mlt_admin';
  const isPetroleumAdmin = user?.role === 'petroleum_admin';
  const isCrusherAdmin = user?.role === 'crusher_admin';

  // Browser back button support
  useEffect(() => {
    const handlePopState = () => {
      if (activeSection) {
        setActiveSection(null);
      } else if (activeDepartment) {
        setActiveDepartment(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection, activeDepartment]);

  const navigateToSection = useCallback((section: SectionType) => {
    window.history.pushState({}, '', '');
    setActiveSection(section);
    setSidebarOpen(false);
  }, []);

  const navigateToDepartment = useCallback((dept: DepartmentType) => {
    if (dept === 'credit-parties') {
      navigateToSection('credit-parties');
      return;
    }
    if (dept === 'crusher-reports') {
      navigateToSection('crusher-reports');
      return;
    }
    window.history.pushState({}, '', '');
    setActiveDepartment(dept);
    setActiveSection(null);
    setSidebarOpen(false);
  }, [navigateToSection]);

  const navigateHome = useCallback(() => {
    setActiveSection(null);
    setActiveDepartment(null);
    setSidebarOpen(false);
  }, []);

  // Department sections
  const getDeptSections = (dept: 'petroleum' | 'crusher' | 'tyres-office'): NavItem[] => {
    const primary: NavItem[] = [
      { id: 'attendance', title: 'Attendance', icon: Calendar, description: 'Mark daily attendance', primary: true },
      { id: 'advance-salary', title: 'Advances', icon: Wallet, description: 'Manage advance payments', primary: true },
    ];
    if (isManager) {
      primary.push(
        { id: 'salary', title: 'Salary', icon: DollarSign, description: 'Calculate salaries', primary: true },
        { id: 'paid-deducted', title: 'Paid & Deducted', icon: CheckCircle, description: 'Track payment status', primary: true },
      );
    }
    const secondary: NavItem[] = [];
    if (dept === 'petroleum' && isManager) {
      secondary.push({ id: 'petroleum-sales', title: 'Petroleum Sales', icon: Fuel, description: 'UPI & Cash sales' });
    }
    if (dept === 'tyres-office' && isManager) {
      secondary.push({ id: 'tyre-sales', title: 'Tyre Sales', icon: CircleDot, description: 'Daily tyre sales' });
    }
    if (isManager) {
      secondary.push(
        { id: 'daily-report', title: 'Daily Report', icon: FileText, description: 'All-in-one report' },
        { id: 'monthly-calendar', title: 'Monthly Report', icon: CalendarDays, description: 'Calendar view' },
        { id: 'yearly-data', title: 'Yearly Data', icon: BarChart3, description: 'Annual reports' },
      );
    }
    secondary.push(
      { id: 'staff', title: 'Staff Management', icon: UserPlus, description: 'Add or remove staff' },
      { id: 'staff-profile', title: 'Staff Profiles', icon: User, description: 'View & share profiles' },
      ...(isManager ? [{ id: 'staff-details' as SectionType, title: 'Shift Rates', icon: UserCog, description: 'Configure shift rates' }] : []),
    );
    if (isManager) {
      secondary.push({ id: 'backup', title: 'Monthly Backup', icon: FolderArchive, description: 'Download reports' });
    }
    return [...primary, ...secondary];
  };

  const mltSections: NavItem[] = [
    { id: 'mlt', title: 'MLT Dashboard', icon: Truck, description: 'Driver & Khalasi management', primary: true },
    { id: 'mlt-services', title: 'MLT Services', icon: Wrench, description: 'Truck service records', primary: true },
    { id: 'mlt-fuel-report', title: 'MLT Fuel Report', icon: Fuel, description: 'Truck fuel tracking' },
  ];

  const departments = useMemo(() => {
    const depts: { id: DepartmentType; title: string; icon: typeof Fuel; description: string }[] = [];
    if (isManager || isPetroleumAdmin) depts.push({ id: 'petroleum', title: 'Petroleum', icon: Fuel, description: 'Fuel station operations' });
    if (isManager || isCrusherAdmin) depts.push({ id: 'crusher', title: 'Crusher', icon: Calendar, description: 'Stone crushing operations' });
    if (isManager || isMltAdmin || isPetroleumAdmin) depts.push({ id: 'mlt', title: 'MLT', icon: Truck, description: 'Driver & Khalasi' });
    if (isManager) {
      depts.push({ id: 'tyres-office', title: 'Tyres & Office', icon: CircleDot, description: 'Tyre sales & office staff' });
      depts.push({ id: 'credit-parties', title: 'Credit Parties', icon: CreditCard, description: 'Petroleum & Tyre credit' });
    }
    if (isManager || isCrusherAdmin) {
      depts.push({ id: 'crusher-reports' as DepartmentType, title: 'Crusher Reports', icon: FileText, description: 'Dispatch & Bolder reports' });
    }
    return depts;
  }, [user]);

  const deptCategory = getDeptCategory(activeDepartment);

  // --- Desktop Sidebar ---
  const renderSidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col border-r border-sidebar-border
      transition-transform duration-200
      ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      lg:static lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={companyLogo} alt="T&T" className="h-9 w-9 object-contain rounded" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Tibrewal & Tibrewal</h1>
            <p className="text-xs text-sidebar-foreground/50">Private Limited</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <SidebarNavItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={!activeDepartment && !activeSection}
          onClick={navigateHome}
        />

        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">Departments</p>
        </div>

        {departments.map((dept) => (
          <SidebarNavItem
            key={dept.id}
            icon={dept.icon}
            label={dept.title}
            active={activeDepartment === dept.id || (dept.id === 'credit-parties' && activeSection === 'credit-parties') || (dept.id === 'crusher-reports' && activeSection === 'crusher-reports')}
            onClick={() => navigateToDepartment(dept.id)}
          />
        ))}

        {/* Crusher ERP tools */}
        {(isManager || isCrusherAdmin) && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">Crusher ERP</p>
            </div>
            {isManager && (
              <>
                <SidebarNavItem icon={Truck} label="Vehicle Management" active={activeSection === 'vehicle-management'} onClick={() => navigateToSection('vehicle-management')} />
                <SidebarNavItem icon={FileText} label="Invoice Generator" active={activeSection === 'invoice-generator'} onClick={() => navigateToSection('invoice-generator')} />
              </>
            )}
            <SidebarNavItem icon={Fuel} label="Fuel Analysis" active={activeSection === 'crusher-fuel-analysis'} onClick={() => navigateToSection('crusher-fuel-analysis')} />
          </>
        )}

        {/* Manager tools */}
        {isManager && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">Tools</p>
            </div>
            <SidebarNavItem icon={Calculator} label="Calculator" active={activeSection === 'calculator'} onClick={() => navigateToSection('calculator')} />
            <SidebarNavItem icon={Image} label="Photo Gallery" active={activeSection === 'photo-gallery'} onClick={() => navigateToSection('photo-gallery')} />
            <SidebarNavItem icon={Bell} label="Reminders" active={activeSection === 'reminders'} onClick={() => navigateToSection('reminders')} />
            <SidebarNavItem icon={Upload} label="Import/Export" active={activeSection === 'bulk-import'} onClick={() => navigateToSection('bulk-import')} />
            <SidebarNavItem icon={Users} label="User Management" active={activeSection === 'user-management'} onClick={() => navigateToSection('user-management')} />
            <SidebarNavItem icon={Settings} label="Settings" active={activeSection === 'settings'} onClick={() => navigateToSection('settings')} />
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-foreground">{user?.full_name?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.full_name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );

  // --- Top Header (Desktop + Mobile) ---
  const renderHeader = () => (
    <header className="sticky top-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {activeSection ? getSectionTitle(activeSection) : activeDepartment ? getDeptTitle(activeDepartment) : 'Dashboard'}
          </h2>
          {!isMobile && (
            <p className="text-[11px] text-muted-foreground">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isMobile && (
          <span className="text-xs text-muted-foreground">{user?.full_name}</span>
        )}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={logout}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </header>
  );

  // Section title helper
  const getSectionTitle = (section: SectionType): string => {
    const titles: Record<string, string> = {
      'attendance': 'Attendance',
      'advance-salary': 'Advances',
      'staff': 'Staff Management',
      'staff-details': 'Shift Rates',
      'monthly-calendar': 'Monthly Report',
      'bulk-import': 'Import/Export',
      'staff-profile': 'Staff Profiles',
      'settings': 'Settings',
      'daily-report': 'Daily Report',
      'calculator': 'Calculator',
      'photo-gallery': 'Photo Gallery',
      'reminders': 'Reminders',
      'mlt': 'MLT Dashboard',
      'petroleum-sales': 'Petroleum Sales',
      'backup': 'Monthly Backup',
      'paid-deducted': 'Paid & Deducted',
      'salary': 'Salary',
      'yearly-data': 'Yearly Data',
      'tyre-sales': 'Tyre Sales',
      'credit-parties': 'Credit Parties',
      'crusher-reports': 'Crusher Reports',
      'mlt-services': 'MLT Services',
      'mlt-fuel-report': 'MLT Fuel Report',
      'user-management': 'User Management',
      'vehicle-management': 'Vehicle Management',
      'invoice-generator': 'Invoice Generator',
      'crusher-fuel-analysis': 'Fuel Analysis',
    };
    return titles[section || ''] || 'Dashboard';
  };

  // Render active section content
  const renderSectionContent = () => {
    if (!activeSection) return null;
    const onBack = () => {
      if (activeDepartment) {
        setActiveSection(null);
      } else {
        setActiveSection(null);
        setActiveDepartment(null);
      }
    };
    return (
      <Suspense fallback={<LoadingFallback />}>
        {activeSection === 'attendance' && <AttendanceSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'advance-salary' && <AdvanceSalarySection onBack={onBack} category={deptCategory} />}
        {activeSection === 'staff' && <StaffSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'staff-details' && <StaffDetailsSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'monthly-calendar' && <MonthlyCalendarSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'bulk-import' && <BulkImportSection onBack={onBack} />}
        {activeSection === 'staff-profile' && <StaffProfileSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'settings' && <SettingsSection onBack={onBack} />}
        {activeSection === 'daily-report' && <DailyReportSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'calculator' && <CalculatorSection onBack={onBack} />}
        {activeSection === 'photo-gallery' && <PhotoGallerySection onBack={onBack} />}
        {activeSection === 'reminders' && <RemindersSection onBack={onBack} />}
        {activeSection === 'mlt' && <MLTSection onBack={onBack} />}
        {activeSection === 'petroleum-sales' && <PetroleumSalesSection onBack={onBack} />}
        {activeSection === 'backup' && <BackupSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'paid-deducted' && <PaymentDeductionSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'salary' && <SalarySection onBack={onBack} category={deptCategory} />}
        {activeSection === 'yearly-data' && <YearlyDataSection onBack={onBack} category={deptCategory} />}
        {activeSection === 'tyre-sales' && <TyreSalesSection onBack={onBack} />}
        {activeSection === 'credit-parties' && <CreditPartiesSection onBack={onBack} />}
        {activeSection === 'crusher-reports' && <CrusherReportsSection onBack={onBack} />}
        {activeSection === 'mlt-services' && <MLTServicesSection onBack={onBack} />}
        {activeSection === 'mlt-fuel-report' && <MLTFuelReportSection onBack={onBack} />}
        {activeSection === 'user-management' && <UserManagementSection onBack={onBack} />}
        {activeSection === 'vehicle-management' && <VehicleManagementSection onBack={onBack} />}
        {activeSection === 'invoice-generator' && <InvoiceGeneratorSection onBack={onBack} />}
        {activeSection === 'crusher-fuel-analysis' && <CrusherFuelAnalysisSection onBack={onBack} />}
      </Suspense>
    );
  };

  // Department detail view content
  const renderDepartmentContent = () => {
    if (!activeDepartment || activeSection) return null;

    let sections: NavItem[] = [];
    if (activeDepartment === 'petroleum') sections = getDeptSections('petroleum');
    else if (activeDepartment === 'crusher') sections = getDeptSections('crusher');
    else if (activeDepartment === 'mlt') {
      sections = mltSections;
      if (isPetroleumAdmin && !isManager) {
        sections = sections.filter(s => s.id === 'mlt-fuel-report');
      }
    }
    else if (activeDepartment === 'tyres-office') sections = getDeptSections('tyres-office');

    if (!isManager) {
      sections = sections.filter(s => !['salary', 'daily-report', 'yearly-data', 'backup', 'petroleum-sales', 'paid-deducted', 'tyre-sales'].includes(s.id || ''));
    }

    const primarySections = sections.filter(s => s.primary);
    const secondarySections = sections.filter(s => !s.primary);

    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Primary Actions */}
        {primarySections.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Primary Actions</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {primarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection(section.id)}>
                    <CardContent className="p-4 lg:p-5 flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-lg bg-primary">
                        <Icon className="h-6 w-6 lg:h-7 lg:w-7 text-primary-foreground" />
                      </div>
                      <p className="text-base lg:text-lg font-bold text-foreground">{section.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Management */}
        {secondarySections.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Management</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
              {secondarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection(section.id)}>
                    <CardContent className="p-3 lg:p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{section.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // Main dashboard content
  const renderDashboard = () => {
    if (activeDepartment || activeSection) return null;

    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* KPI Cards */}
        {isManager && (
          <div className="mb-6">
            <KpiCards />
          </div>
        )}

        {/* Departments */}
        <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Departments</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <Card key={dept.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToDepartment(dept.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-foreground">{dept.title}</h2>
                      <p className="text-xs text-muted-foreground">{dept.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Crusher ERP - Crusher Admin fuel analysis */}
        {isCrusherAdmin && !isManager && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">⛽ Crusher Tools</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection('crusher-fuel-analysis')}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Fuel className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">⛽ Fuel Analysis</p>
                      <p className="text-xs text-muted-foreground">Crusher fuel tracking</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Crusher ERP - Manager Only */}
        {isManager && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">🚀 Crusher ERP</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { id: 'vehicle-management' as SectionType, title: '🚛 Vehicle Management', icon: Truck, desc: 'Trucks, maintenance & fuel' },
                { id: 'invoice-generator' as SectionType, title: '🧾 Invoice Generator', icon: FileText, desc: 'GST invoices & PDF' },
                { id: 'crusher-fuel-analysis' as SectionType, title: '⛽ Fuel Analysis', icon: Fuel, desc: 'Crusher fuel tracking' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection(item.id)}>
                    <CardContent className="p-3 lg:p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary">
                          <Icon className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Manager tools */}
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {[
                { id: 'calculator' as SectionType, title: 'Calculator', icon: Calculator },
                { id: 'photo-gallery' as SectionType, title: 'Photo Gallery', icon: Image },
                { id: 'reminders' as SectionType, title: 'Reminders', icon: Bell },
                { id: 'bulk-import' as SectionType, title: 'Import/Export', icon: Upload },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection(item.id)}>
                    <CardContent className="p-3 lg:p-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection('user-management')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary"><Users className="h-5 w-5 text-primary-foreground" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">User Management</p>
                      <p className="text-xs text-muted-foreground">Add & manage user profiles</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border" onClick={() => navigateToSection('settings')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted"><Settings className="h-5 w-5 text-muted-foreground" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Settings</p>
                      <p className="text-xs text-muted-foreground">Full Database Backup</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Tibrewal & Tibrewal Pvt. Ltd.</p>
          <p>Mining & Construction • Jharkhand</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderHeader()}
        <main className="flex-1 overflow-auto">
          {activeSection ? renderSectionContent() : activeDepartment ? renderDepartmentContent() : renderDashboard()}
        </main>
      </div>

      <AIChatBot includeData={!activeSection} />
    </div>
  );
};

export default Home;
