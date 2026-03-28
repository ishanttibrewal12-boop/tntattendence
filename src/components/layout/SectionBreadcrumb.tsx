import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LayoutDashboard } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Command Centre',
  '/staff': 'Staff Management',
  '/attendance': 'Attendance',
  '/payroll': 'Payroll',
};

const SectionBreadcrumb = () => {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || 'Page';

  if (location.pathname === '/dashboard') return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default SectionBreadcrumb;
