import { useState, useMemo, lazy, Suspense } from 'react';
import { Calendar, Wallet, UserPlus, CalendarDays, Upload, User, UserCog, Settings, FileText, Calculator, Image, Bell, Fuel, FolderArchive, CheckCircle, DollarSign, BarChart3, LogOut, Truck, CircleDot, CreditCard, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/contexts/AppAuthContext';
import companyLogo from '@/assets/company-logo.png';

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

type SectionType = 'attendance' | 'advance-salary' | 'staff' | 'staff-details' | 'monthly-calendar' | 'bulk-import' | 'staff-profile' | 'settings' | 'daily-report' | 'calculator' | 'photo-gallery' | 'reminders' | 'mlt' | 'petroleum-sales' | 'backup' | 'paid-deducted' | 'salary' | 'yearly-data' | 'tyre-sales' | 'credit-parties' | null;

type DepartmentType = 'petroleum' | 'crusher' | 'mlt' | 'tyres-office' | 'credit-parties' | null;

// Map department to staff category for filtering
type StaffCategory = 'petroleum' | 'crusher' | 'office';

const getDeptCategory = (dept: DepartmentType): StaffCategory | undefined => {
  if (dept === 'petroleum') return 'petroleum';
  if (dept === 'crusher') return 'crusher';
  if (dept === 'tyres-office') return 'office';
  return undefined;
};

interface NavItem {
  id: SectionType;
  title: string;
  icon: typeof Calendar;
  description: string;
  primary?: boolean;
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-primary text-sm">Loading...</div>
  </div>
);

const Home = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>(null);
  const { user, logout } = useAppAuth();

  const isManager = user?.role === 'manager';
  const isMltAdmin = user?.role === 'mlt_admin';
  const isPetroleumAdmin = user?.role === 'petroleum_admin';
  const isCrusherAdmin = user?.role === 'crusher_admin';

  // Department sections for Petroleum, Crusher, Office
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
      { id: 'staff-details', title: 'Shift Rates', icon: UserCog, description: 'Configure shift rates' },
    );

    if (isManager) {
      secondary.push({ id: 'backup', title: 'Monthly Backup', icon: FolderArchive, description: 'Download reports' });
    }

    return [...primary, ...secondary];
  };

  // MLT sections
  const mltSections: NavItem[] = [
    { id: 'mlt', title: 'MLT Dashboard', icon: Truck, description: 'Driver & Khalasi management', primary: true },
  ];

  // Departments visible based on role
  const departments = useMemo(() => {
    const depts: { id: DepartmentType; title: string; icon: typeof Fuel; description: string }[] = [];
    if (isManager || isPetroleumAdmin) depts.push({ id: 'petroleum', title: 'Petroleum', icon: Fuel, description: 'Fuel station operations' });
    if (isManager || isCrusherAdmin) depts.push({ id: 'crusher', title: 'Crusher', icon: Calendar, description: 'Stone crushing operations' });
    if (isManager || isMltAdmin) depts.push({ id: 'mlt', title: 'MLT', icon: Truck, description: 'Driver & Khalasi' });
    if (isManager) {
      depts.push({ id: 'tyres-office', title: 'Tyres & Office', icon: CircleDot, description: 'Tyre sales & office staff' });
      depts.push({ id: 'credit-parties', title: 'Credit Parties', icon: CreditCard, description: 'Petroleum & Tyre credit' });
    }
    return depts;
  }, [user]);

  // Get department category for passing to sections
  const deptCategory = getDeptCategory(activeDepartment);

  // Render active section with category context
  if (activeSection) {
    const onBack = () => setActiveSection(null);
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-background">
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
        </div>
      </Suspense>
    );
  }

  // Department detail view
  if (activeDepartment) {
    let sections: NavItem[] = [];
    let deptTitle = '';
    if (activeDepartment === 'petroleum') { sections = getDeptSections('petroleum'); deptTitle = 'Petroleum'; }
    else if (activeDepartment === 'crusher') { sections = getDeptSections('crusher'); deptTitle = 'Crusher'; }
    else if (activeDepartment === 'mlt') { sections = mltSections; deptTitle = 'MLT'; }
    else if (activeDepartment === 'tyres-office') { sections = getDeptSections('tyres-office'); deptTitle = 'Tyres & Office'; }
    else if (activeDepartment === 'credit-parties') {
      setActiveSection('credit-parties');
      setActiveDepartment(null);
      return null;
    }

    // For non-manager petroleum/crusher admin, filter salary-only sections
    if (!isManager) {
      sections = sections.filter(s => !['salary', 'daily-report', 'yearly-data', 'backup', 'petroleum-sales', 'paid-deducted', 'tyre-sales'].includes(s.id || ''));
    }

    const primarySections = sections.filter(s => s.primary);
    const secondarySections = sections.filter(s => !s.primary);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveDepartment(null)}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{deptTitle}</h1>
          </div>

          {/* Primary Actions - 2 column grid */}
          {primarySections.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {primarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection(section.id)}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2" style={{ minHeight: '96px' }}>
                      <div className="p-2.5 rounded-lg" style={{ background: '#1e3a8a' }}>
                        <Icon className="h-7 w-7" style={{ color: 'white' }} />
                      </div>
                      <p className="text-lg font-bold text-foreground leading-tight">{section.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Secondary Actions - single column */}
          {secondarySections.length > 0 && (
            <div className="space-y-2">
              {secondarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection(section.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ background: '#1e3a8a' }}>
                          <Icon className="h-5 w-5" style={{ color: 'white' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{section.title}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main dashboard - department cards
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <img src={companyLogo} alt="Tibrewal Staff Manager" className="h-20 w-20 mx-auto mb-3 object-contain" loading="lazy" />
          <h1 className="text-2xl font-bold text-foreground">Tibrewal Staff Manager</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Welcome, {user?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="h-7 px-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">
            {user?.role.replace('_', ' ')}
          </span>
        </div>

        {/* Department Cards */}
        <div className="space-y-3 mb-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <Card key={dept.id} className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]" onClick={() => {
                if (dept.id === 'credit-parties') setActiveSection('credit-parties');
                else setActiveDepartment(dept.id);
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ background: '#1e3a8a' }}>
                      <Icon className="h-6 w-6" style={{ color: 'white' }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground">{dept.title}</h2>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Manager-only tools */}
        {isManager && (
          <>
            <p className="text-xs text-muted-foreground mb-2 px-1">More Tools</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { id: 'calculator' as SectionType, title: 'Calculator', icon: Calculator, desc: 'Quick calculations' },
                { id: 'photo-gallery' as SectionType, title: 'Photo Gallery', icon: Image, desc: 'Daily photos' },
                { id: 'reminders' as SectionType, title: 'Reminders', icon: Bell, desc: 'Notifications' },
                { id: 'bulk-import' as SectionType, title: 'Import/Export', icon: Upload, desc: 'Bulk operations' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection(item.id)}>
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg" style={{ background: '#1e3a8a' }}>
                          <Icon className="h-5 w-5" style={{ color: 'white' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Settings */}
            <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection('settings')}>
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
          </>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Tibrewal & Tibrewal Pvt. Ltd.</p>
          <p>Mining & Construction • Jharkhand</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
