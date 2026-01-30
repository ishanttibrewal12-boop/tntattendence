import { useState } from 'react';
import { Users, Calendar, Wallet, UserPlus, CalendarDays, Upload, User, UserCog, Settings, FileText, Calculator, Image, Bell, Truck, Fuel, FolderArchive, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PinLock from '@/components/PinLock';
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
import companyLogo from '@/assets/company-logo.png';

type SectionType = 'attendance' | 'advance-salary' | 'staff' | 'staff-details' | 'monthly-calendar' | 'bulk-import' | 'staff-profile' | 'settings' | 'daily-report' | 'calculator' | 'photo-gallery' | 'reminders' | 'mlt' | 'petroleum-sales' | 'backup' | null;

const Home = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>(null);

  if (!isUnlocked) {
    return <PinLock onUnlock={() => setIsUnlocked(true)} />;
  }

  const mainSections = [
    { id: 'attendance' as SectionType, title: 'Attendance', icon: Calendar, description: 'Mark daily attendance', color: 'bg-primary' },
    { id: 'advance-salary' as SectionType, title: 'Advance & Salary', icon: Wallet, description: 'Manage payments', color: 'bg-secondary' },
    { id: 'petroleum-sales' as SectionType, title: 'Petroleum Sales', icon: Fuel, description: 'UPI & Cash sales', color: 'bg-accent-foreground' },
    { id: 'mlt' as SectionType, title: 'MLT Section', icon: Truck, description: 'Driver & Khalasi', color: 'bg-chart-1' },
  ];

  const extraSections = [
    { id: 'daily-report' as SectionType, title: 'Daily Report', icon: FileText, description: 'All-in-one report', color: 'bg-chart-5' },
    { id: 'staff-details' as SectionType, title: 'Staff Details', icon: UserCog, description: 'View & edit details', color: 'bg-chart-2' },
    { id: 'monthly-calendar' as SectionType, title: 'Monthly Report', icon: CalendarDays, description: 'Calendar view', color: 'bg-chart-3' },
    { id: 'staff-profile' as SectionType, title: 'Staff Profiles', icon: User, description: 'View & share profiles', color: 'bg-chart-4' },
  ];

  const moreSections = [
    { id: 'staff' as SectionType, title: 'Staff', icon: UserPlus, description: 'Add or remove staff', color: 'bg-chart-3' },
    { id: 'backup' as SectionType, title: 'Monthly Backup', icon: FolderArchive, description: 'Download reports', color: 'bg-chart-4' },
    { id: 'calculator' as SectionType, title: 'Calculator', icon: Calculator, description: 'Quick calculations', color: 'bg-primary' },
    { id: 'photo-gallery' as SectionType, title: 'Photo Gallery', icon: Image, description: 'Daily photos', color: 'bg-secondary' },
    { id: 'reminders' as SectionType, title: 'Reminders', icon: Bell, description: 'Set notifications', color: 'bg-accent-foreground' },
    { id: 'bulk-import' as SectionType, title: 'Import/Export', icon: Upload, description: 'Bulk operations', color: 'bg-muted-foreground' },
  ];

  if (activeSection) {
    return (
      <div className="min-h-screen bg-background">
        {activeSection === 'attendance' && <AttendanceSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'advance-salary' && <AdvanceSalarySection onBack={() => setActiveSection(null)} />}
        {activeSection === 'staff' && <StaffSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'staff-details' && <StaffDetailsSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'monthly-calendar' && <MonthlyCalendarSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'bulk-import' && <BulkImportSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'staff-profile' && <StaffProfileSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'settings' && <SettingsSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'daily-report' && <DailyReportSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'calculator' && <CalculatorSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'photo-gallery' && <PhotoGallerySection onBack={() => setActiveSection(null)} />}
        {activeSection === 'reminders' && <RemindersSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'mlt' && <MLTSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'petroleum-sales' && <PetroleumSalesSection onBack={() => setActiveSection(null)} />}
        {activeSection === 'backup' && <BackupSection onBack={() => setActiveSection(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 pt-4">
          <img src={companyLogo} alt="Tibrewal Staff Manager" className="h-20 w-20 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-foreground">Tibrewal Staff Manager</h1>
          <p className="text-muted-foreground text-xs">Contact: 6203229118</p>
        </div>

        <div className="space-y-3 mb-6">
          {mainSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]" onClick={() => setActiveSection(section.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${section.color}`}><Icon className="h-6 w-6 text-primary-foreground" /></div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mb-2 px-1">Reports & Profiles</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {extraSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection(section.id)}>
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-2 rounded-lg ${section.color}`}><Icon className="h-5 w-5 text-primary-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mb-2 px-1">More Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {moreSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" onClick={() => setActiveSection(section.id)}>
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-2 rounded-lg ${section.color}`}><Icon className="h-5 w-5 text-primary-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Settings */}
        <Card 
          className="mt-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]" 
          onClick={() => setActiveSection('settings')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Settings</p>
                <p className="text-xs text-muted-foreground">PIN & Backup</p>
              </div>
              <div className="text-muted-foreground">→</div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Tibrewal & Tibrewal Pvt. Ltd.</p>
          <p>Mining & Construction • Jharkhand</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
