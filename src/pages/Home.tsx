import { useState } from 'react';
import { Users, Calendar, Wallet, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AttendanceSection from '@/components/sections/AttendanceSection';
import AdvanceSalarySection from '@/components/sections/AdvanceSalarySection';
import StaffSection from '@/components/sections/StaffSection';

type SectionType = 'attendance' | 'advance-salary' | 'staff' | null;

const Home = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);

  const sections = [
    {
      id: 'attendance' as SectionType,
      title: 'Attendance',
      icon: Calendar,
      description: 'Mark & export attendance',
      color: 'bg-primary',
    },
    {
      id: 'advance-salary' as SectionType,
      title: 'Advance & Salary',
      icon: Wallet,
      description: 'Manage payments',
      color: 'bg-secondary',
    },
    {
      id: 'staff' as SectionType,
      title: 'Staff',
      icon: UserPlus,
      description: 'Add or remove staff',
      color: 'bg-accent-foreground',
    },
  ];

  if (activeSection) {
    return (
      <div className="min-h-screen bg-background">
        {activeSection === 'attendance' && (
          <AttendanceSection onBack={() => setActiveSection(null)} />
        )}
        {activeSection === 'advance-salary' && (
          <AdvanceSalarySection onBack={() => setActiveSection(null)} />
        )}
        {activeSection === 'staff' && (
          <StaffSection onBack={() => setActiveSection(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">TNT Staff Manager</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Contact: abhayjalan2682@gmail.com
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
                onClick={() => setActiveSection(section.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${section.color}`}>
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {section.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
