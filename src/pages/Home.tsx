import { useState, useMemo } from 'react';
import { Calendar, Wallet, UserPlus, CalendarDays, Upload, User, UserCog, Settings, FileText, Calculator, Image, Bell, Fuel, FolderArchive, CheckCircle, DollarSign, BarChart3, LogOut, Truck, CircleDot, CreditCard, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/contexts/AppAuthContext';
import AttendanceSection from '@/components/sections/AttendanceSection';
import AdvanceSalarySection from '@/components/sections/AdvanceSalarySection';
import StaffSection from '@/components/sections/StaffSection';
import StaffDetailsSection from '@/components/sections/StaffDetailsSection';
import MonthlyCalendarSection from '@/components/sections/MonthlyCalendarSection';
import BulkImportSection from '@/components/sections/BulkImportSection';
import StaffProfileSection from '@/components/sections/StaffProfileSection';
import SettingsSection from '@/components/sections/SettingsSection';
import DailyReportSection from '@/components/sections/DailyReportSection';
import CalculatorSection from '@/components/sections/CalculatorSection';
import PhotoGallerySection from '@/components/sections/PhotoGallerySection';
import RemindersSection from '@/components/sections/RemindersSection';
import MLTSection from '@/components/sections/MLTSection';
import PetroleumSalesSection from '@/components/sections/PetroleumSalesSection';
import BackupSection from '@/components/sections/BackupSection';
import PaymentDeductionSection from '@/components/sections/PaymentDeductionSection';
import SalarySection from '@/components/sections/SalarySection';
import YearlyDataSection from '@/components/sections/YearlyDataSection';
import TyreSalesSection from '@/components/sections/TyreSalesSection';
import CreditPartiesSection from '@/components/sections/CreditPartiesSection';
import companyLogo from '@/assets/company-logo.png';

type SectionType = 'attendance' | 'advance-salary' | 'staff' | 'staff-details' | 'monthly-calendar' | 'bulk-import' | 'staff-profile' | 'settings' | 'daily-report' | 'calculator' | 'photo-gallery' | 'reminders' | 'mlt' | 'petroleum-sales' | 'backup' | 'paid-deducted' | 'salary' | 'yearly-data' | 'tyre-sales' | 'credit-parties' | null;

type DepartmentType = 'petroleum' | 'crusher' | 'mlt' | 'tyres-office' | 'credit-parties' | null;

interface NavItem {
  id: SectionType;
  title: string;
  icon: typeof Calendar;
  description: string;
}

const Home = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>(null);
  const { user, logout } = useAppAuth();

  const isManager = user?.role === 'manager';
  const isMltAdmin = user?.role === 'mlt_admin';
  const isPetroleumAdmin = user?.role === 'petroleum_admin';
  const isCrusherAdmin = user?.role === 'crusher_admin';

  // Department sections for Petroleum & Crusher (shared structure)
  const getDeptSections = (dept: 'petroleum' | 'crusher'): NavItem[] => {
    const sections: NavItem[] = [
      { id: 'attendance', title: 'Attendance', icon: Calendar, description: 'Mark daily attendance' },
      { id: 'advance-salary', title: 'Advances', icon: Wallet, description: 'Manage advance payments' },
      { id: 'salary', title: 'Salary', icon: DollarSign, description: 'Calculate salaries' },
      { id: 'paid-deducted', title: 'Paid & Deducted', icon: CheckCircle, description: 'Track payment status' },
    ];
    if (dept === 'petroleum' && isManager) {
      sections.push({ id: 'petroleum-sales', title: 'Petroleum Sales', icon: Fuel, description: 'UPI & Cash sales' });
    }
    sections.push(
      { id: 'daily-report', title: 'Daily Report', icon: FileText, description: 'All-in-one report' },
      { id: 'monthly-calendar', title: 'Monthly Report', icon: CalendarDays, description: 'Calendar view' },
      { id: 'yearly-data', title: 'Yearly Data', icon: BarChart3, description: 'Annual reports' },
      { id: 'staff', title: 'Staff Management', icon: UserPlus, description: 'Add or remove staff' },
      { id: 'staff-profile', title: 'Staff Profiles', icon: User, description: 'View & share profiles' },
      { id: 'staff-details', title: 'Shift Rates', icon: UserCog, description: 'Configure shift rates' },
      { id: 'backup', title: 'Monthly Backup', icon: FolderArchive, description: 'Download reports' },
    );
    return sections;
  };

  // MLT sections
  const mltSections: NavItem[] = [
    { id: 'mlt', title: 'MLT Dashboard', icon: Truck, description: 'Driver & Khalasi management' },
  ];

  // Tyres & Office sections (Manager only)
  const tyresOfficeSections: NavItem[] = [
    { id: 'attendance', title: 'Attendance', icon: Calendar, description: 'Office staff attendance' },
    { id: 'advance-salary', title: 'Advances', icon: Wallet, description: 'Advance payments' },
    { id: 'salary', title: 'Salary', icon: DollarSign, description: 'Calculate salaries' },
    { id: 'paid-deducted', title: 'Paid & Deducted', icon: CheckCircle, description: 'Payment status' },
    { id: 'tyre-sales', title: 'Tyre Sales', icon: CircleDot, description: 'Daily tyre sales' },
    { id: 'daily-report', title: 'Daily Report', icon: FileText, description: 'All-in-one report' },
    { id: 'monthly-calendar', title: 'Monthly Report', icon: CalendarDays, description: 'Calendar view' },
    { id: 'yearly-data', title: 'Yearly Data', icon: BarChart3, description: 'Annual reports' },
    { id: 'staff', title: 'Staff Management', icon: UserPlus, description: 'Add or remove' },
    { id: 'staff-profile', title: 'Staff Profiles', icon: User, description: 'View & share' },
    { id: 'staff-details', title: 'Shift Rates', icon: UserCog, description: 'Configure rates' },
    { id: 'backup', title: 'Monthly Backup', icon: FolderArchive, description: 'Download reports' },
  ];

  // Departments visible based on role
  const departments = useMemo(() => {
    const depts: { id: DepartmentType; title: string; icon: typeof Fuel; description: string; color: string }[] = [];
    if (isManager || isPetroleumAdmin) depts.push({ id: 'petroleum', title: 'Petroleum', icon: Fuel, description: 'Fuel station operations', color: '#1e3a8a' });
    if (isManager || isCrusherAdmin) depts.push({ id: 'crusher', title: 'Crusher', icon: Calendar, description: 'Stone crushing operations', color: '#1e3a8a' });
    if (isManager || isMltAdmin) depts.push({ id: 'mlt', title: 'MLT', icon: Truck, description: 'Driver & Khalasi', color: '#1e3a8a' });
    if (isManager) {
      depts.push({ id: 'tyres-office', title: 'Tyres & Office', icon: CircleDot, description: 'Tyre sales & office staff', color: '#1e3a8a' });
      depts.push({ id: 'credit-parties', title: 'Credit Parties', icon: CreditCard, description: 'Petroleum & Tyre credit', color: '#1e3a8a' });
    }
    return depts;
  }, [user]);

  // Render active section
  if (activeSection) {
    const onBack = () => setActiveSection(null);
    return (
      <div className="min-h-screen bg-background">
        {activeSection === 'attendance' && <AttendanceSection onBack={onBack} />}
        {activeSection === 'advance-salary' && <AdvanceSalarySection onBack={onBack} />}
        {activeSection === 'staff' && <StaffSection onBack={onBack} />}
        {activeSection === 'staff-details' && <StaffDetailsSection onBack={onBack} />}
        {activeSection === 'monthly-calendar' && <MonthlyCalendarSection onBack={onBack} />}
        {activeSection === 'bulk-import' && <BulkImportSection onBack={onBack} />}
        {activeSection === 'staff-profile' && <StaffProfileSection onBack={onBack} />}
        {activeSection === 'settings' && <SettingsSection onBack={onBack} />}
        {activeSection === 'daily-report' && <DailyReportSection onBack={onBack} />}
        {activeSection === 'calculator' && <CalculatorSection onBack={onBack} />}
        {activeSection === 'photo-gallery' && <PhotoGallerySection onBack={onBack} />}
        {activeSection === 'reminders' && <RemindersSection onBack={onBack} />}
        {activeSection === 'mlt' && <MLTSection onBack={onBack} />}
        {activeSection === 'petroleum-sales' && <PetroleumSalesSection onBack={onBack} />}
        {activeSection === 'backup' && <BackupSection onBack={onBack} />}
        {activeSection === 'paid-deducted' && <PaymentDeductionSection onBack={onBack} />}
        {activeSection === 'salary' && <SalarySection onBack={onBack} />}
        {activeSection === 'yearly-data' && <YearlyDataSection onBack={onBack} />}
        {activeSection === 'tyre-sales' && <TyreSalesSection onBack={onBack} />}
        {activeSection === 'credit-parties' && <CreditPartiesSection onBack={onBack} />}
      </div>
    );
  }

  // Department detail view
  if (activeDepartment) {
    let sections: NavItem[] = [];
    let deptTitle = '';
    if (activeDepartment === 'petroleum') { sections = getDeptSections('petroleum'); deptTitle = 'Petroleum'; }
    else if (activeDepartment === 'crusher') { sections = getDeptSections('crusher'); deptTitle = 'Crusher'; }
    else if (activeDepartment === 'mlt') { sections = mltSections; deptTitle = 'MLT'; }
    else if (activeDepartment === 'tyres-office') { sections = tyresOfficeSections; deptTitle = 'Tyres & Office'; }
    else if (activeDepartment === 'credit-parties') {
      setActiveSection('credit-parties');
      setActiveDepartment(null);
      return null;
    }

    // Manager-only extras
    if (isManager && (activeDepartment === 'petroleum' || activeDepartment === 'crusher' || activeDepartment === 'tyres-office')) {
      // Already included in getDeptSections
    }

    // For non-manager petroleum/crusher admin, filter salary-only sections
    if (!isManager) {
      sections = sections.filter(s => !['salary', 'daily-report', 'yearly-data', 'backup', 'petroleum-sales'].includes(s.id || ''));
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveDepartment(null)}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{deptTitle}</h1>
          </div>

          <div className="space-y-2">
            {sections.map((section) => {
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
          <img src={companyLogo} alt="Tibrewal Staff Manager" className="h-20 w-20 mx-auto mb-3 object-contain" />
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
                    <div className="p-3 rounded-xl" style={{ background: dept.color }}>
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
                { id: 'backup' as SectionType, title: 'Monthly Backup', icon: FolderArchive, desc: 'Download reports' },
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
