import { useState, useMemo, lazy, Suspense, useEffect, useCallback } from 'react';
import { Calendar, Wallet, UserPlus, CalendarDays, Upload, User, UserCog, Settings, FileText, Calculator, Image, Bell, Fuel, FolderArchive, CheckCircle, DollarSign, BarChart3, LogOut, Truck, CircleDot, CreditCard, ChevronRight, Users, Clock, Wrench, LayoutDashboard, Menu, X, TrendingUp, AlertTriangle, Zap, Home as HomeIcon, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/contexts/AppAuthContext';
import companyLogo from '@/assets/tibrewal-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import AIChatBot from '@/components/AIChatBot';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/ui/PageTransition';
import LogoWipeTransition from '@/components/ui/LogoWipeTransition';
import CorporateDashboard from '@/components/dashboard/CorporateDashboard';

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
const FileManagerSection = lazy(() => import('@/components/sections/FileManagerSection'));
const ProfileSection = lazy(() => import('@/components/sections/ProfileSection'));

type SectionType = 'attendance' | 'advance-salary' | 'staff' | 'staff-details' | 'monthly-calendar' | 'bulk-import' | 'staff-profile' | 'settings' | 'daily-report' | 'calculator' | 'photo-gallery' | 'reminders' | 'mlt' | 'petroleum-sales' | 'backup' | 'paid-deducted' | 'salary' | 'yearly-data' | 'tyre-sales' | 'credit-parties' | 'crusher-reports' | 'mlt-services' | 'mlt-fuel-report' | 'user-management' | 'vehicle-management' | 'invoice-generator' | 'crusher-fuel-analysis' | 'file-manager' | 'profile' | null;

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
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

const LoadingFallback = () => (
  <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-4">
    <SkeletonPulse className="h-8 w-48" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-8 w-32" />
        </div>
      ))}
    </div>
    <SkeletonPulse className="h-64 w-full rounded-xl" />
  </div>
);

// KpiCards and InsightPanel moved to CorporateDashboard component

// --- Sidebar Navigation Item ---
interface SidebarNavItemProps {
  icon: typeof Calendar;
  label: string;
  active?: boolean;
  onClick: () => void;
  indent?: boolean;
}

const SidebarNavItem = ({ icon: Icon, label, active, onClick, indent }: SidebarNavItemProps) => (
  <motion.button
    whileHover={{ x: 3 }}
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.15 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative ${
      indent ? 'pl-9' : ''
    } ${
      active
        ? 'bg-sidebar-accent text-sidebar-primary sidebar-glow'
        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
    }`}
  >
    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
    <span className="truncate">{label}</span>
  </motion.button>
);

// --- Mobile Bottom Nav ---
const MobileBottomNav = ({ activeDepartment, activeSection, onHome, onDept }: {
  activeDepartment: DepartmentType;
  activeSection: SectionType;
  onHome: () => void;
  onDept: (d: DepartmentType) => void;
}) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'crusher', icon: Calendar, label: 'Crusher' },
    { id: 'petroleum', icon: Fuel, label: 'Petroleum' },
    { id: 'mlt', icon: Truck, label: 'MLT' },
  ];

  const activeId = !activeDepartment && !activeSection ? 'home' : activeDepartment || '';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-header border-t border-border">
      <div className="flex items-center justify-around py-2 px-1 safe-area-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => tab.id === 'home' ? onHome() : onDept(tab.id as DepartmentType)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Home = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoWipe, setShowLogoWipe] = useState(false);
  const [pendingBack, setPendingBack] = useState<'section' | 'department' | null>(null);
  const { user, requestLogout } = useAppAuth();
  const isMobile = useIsMobile();

  const isManager = user?.role === 'manager';
  const isMltAdmin = user?.role === 'mlt_admin';
  const isPetroleumAdmin = user?.role === 'petroleum_admin';
  const isCrusherAdmin = user?.role === 'crusher_admin';

  // Browser back button support
  useEffect(() => {
    const handlePopState = () => {
      if (activeSection) {
        // Go back from section to department (or home if no department)
        setActiveSection(null);
        if (!activeDepartment) {
          // No department context, we're already at home after clearing section
        }
      } else if (activeDepartment) {
        setActiveDepartment(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection, activeDepartment]);

  const triggerLogoBack = useCallback((type: 'section' | 'department') => {
    setPendingBack(type);
    setShowLogoWipe(true);
  }, []);

  const handleLogoWipeComplete = useCallback(() => {
    if (pendingBack === 'section') {
      setActiveSection(null);
    } else if (pendingBack === 'department') {
      setActiveDepartment(null);
    }
    setPendingBack(null);
    setShowLogoWipe(false);
  }, [pendingBack]);

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
      fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar flex flex-col border-r border-sidebar-border
      transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]
      ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      lg:static lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={companyLogo} alt="T&T" className="h-9 w-9 object-contain rounded-lg" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">Tibrewal Group</h1>
            <p className="text-[10px] text-sidebar-foreground/40 font-medium">Industrial Business Group</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <SidebarNavItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={!activeDepartment && !activeSection}
          onClick={navigateHome}
        />

        <div className="pt-4 pb-1.5">
          <p className="px-3 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.15em]">Departments</p>
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
            <div className="pt-4 pb-1.5">
              <p className="px-3 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.15em]">Crusher ERP</p>
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
            <div className="pt-4 pb-1.5">
              <p className="px-3 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.15em]">Tools</p>
            </div>
            <SidebarNavItem icon={Folder} label="File Manager" active={activeSection === 'file-manager'} onClick={() => navigateToSection('file-manager')} />
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
          <div className="h-9 w-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-primary">{user?.full_name?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name}</p>
            <p className="text-[10px] text-sidebar-foreground/40 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={requestLogout} className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </aside>
  );

  // --- Glass Header ---
  const renderHeader = () => (
    <header className="sticky top-0 z-40 h-16 glass-header border-b border-border/50 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            {activeSection ? getSectionTitle(activeSection) : activeDepartment ? getDeptTitle(activeDepartment) : 'Command Center'}
          </h2>
          {!isMobile && (
            <p className="text-[11px] text-muted-foreground font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isMobile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <div className="h-2 w-2 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground">Live</span>
          </div>
        )}
        {!isMobile && (
          <span className="text-xs font-semibold text-foreground/70">{user?.full_name}</span>
        )}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={requestLogout}>
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
        triggerLogoBack('section');
      } else {
        triggerLogoBack('section');
      }
    };
    return (
      <PageTransition>
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
          {activeSection === 'file-manager' && <FileManagerSection onBack={onBack} />}
        </Suspense>
      </PageTransition>
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
      <PageTransition>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {/* Primary Actions */}
          {primarySections.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.15em]">Quick Actions</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {primarySections.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                      <Card className="cursor-pointer card-hover border border-border/50 overflow-hidden" onClick={() => navigateToSection(section.id)}>
                        <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                          <div className="p-3.5 rounded-xl bg-primary glow-accent">
                            <Icon className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <p className="text-sm font-bold text-foreground tracking-tight">{section.title}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Management */}
          {secondarySections.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.15em]">Management</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {secondarySections.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.04, duration: 0.25 }}
                    >
                      <Card className="cursor-pointer card-hover border border-border/50" onClick={() => navigateToSection(section.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-foreground tracking-tight">{section.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{section.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    );
  };

  // Main dashboard content
  const renderDashboard = () => {
    if (activeDepartment || activeSection) return null;

    return (
      <PageTransition>
        <CorporateDashboard
          isManager={isManager}
          onNavigateDepartment={navigateToDepartment}
          onNavigateSection={navigateToSection}
        />
      </PageTransition>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderHeader()}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeSection ? renderSectionContent() : activeDepartment ? renderDepartmentContent() : renderDashboard()}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <MobileBottomNav
          activeDepartment={activeDepartment}
          activeSection={activeSection}
          onHome={navigateHome}
          onDept={navigateToDepartment}
        />
      )}

      <AIChatBot includeData={!activeSection} />
      <LogoWipeTransition show={showLogoWipe} onComplete={handleLogoWipeComplete} />
    </div>
  );
};

export default Home;
