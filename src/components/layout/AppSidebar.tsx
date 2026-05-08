import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, IndianRupee, Settings } from 'lucide-react';
import gsap from 'gsap';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import companyLogo from '@/assets/tibrewal-logo.png';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useMagneticGroup } from '@/lib/motion/gsapUtils';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon } from 'lucide-react';

const overview = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const operations = [
  { path: '/staff',      label: 'Staff',      icon: Users },
  { path: '/attendance', label: 'Attendance', icon: Calendar },
  { path: '/payroll',    label: 'Payroll',    icon: IndianRupee },
];

const tools = [
  { path: '/settings', label: 'Settings', icon: Settings },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { user, requestLogout } = useAppAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useMagneticGroup(sidebarRef, '[data-sidebar="menu-button"]', 0.2);

  useEffect(() => {
    const root = sidebarRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from(root, { x: -40, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from(root.querySelectorAll('[data-sidebar="menu-item"]'), {
        opacity: 0, x: -16, duration: 0.45, stagger: 0.04, ease: 'power3.out', delay: 0.15,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const isActive = (p: string) => pathname === p;

  const renderGroup = (label: string, items: typeof overview) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.path)}
                  tooltip={collapsed ? item.label : undefined}
                  className="rounded-lg"
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <img src={companyLogo} alt="Tibrewal Group" className="h-8 w-8 object-contain rounded-md shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate">Tibrewal Group</p>
              <p className="text-[10px] text-muted-foreground truncate">Industrial Business Group</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {renderGroup('Overview',   overview)}
        {renderGroup('Operations', operations)}
        {renderGroup('Tools',      tools)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className={`flex ${collapsed ? 'flex-col' : 'items-center justify-between'} gap-1`}>
          {!collapsed && user?.full_name && (
            <div className="min-w-0 px-2">
              <p className="text-xs font-medium truncate">{user.full_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize truncate">
                {user.role?.replace('_', ' ') || 'Administrator'}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={requestLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
