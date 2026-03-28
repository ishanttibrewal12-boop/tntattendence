import { useState, useEffect, useCallback } from 'react';
import { Search, X, User, Calendar, Wallet, Truck, Users, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface StaffResult {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  type: 'staff';
}

interface VehicleResult {
  id: string;
  truck_number: string;
  driver_name: string | null;
  is_active: boolean;
  type: 'vehicle';
}

interface PartyResult {
  id: string;
  name: string;
  phone: string | null;
  type: 'party';
}

type SearchResult = StaffResult | VehicleResult | PartyResult;

interface GlobalSearchProps {
  onSelectStaff?: (staffId: string, section: 'attendance' | 'advance' | 'profile') => void;
}

const GlobalSearch = ({ onSelectStaff }: GlobalSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const q = `%${query}%`;

    const [staffRes, vehicleRes, partyRes] = await Promise.all([
      supabase.from('staff').select('id, name, category, phone').eq('is_active', true).ilike('name', q).limit(5),
      supabase.from('vehicles').select('id, truck_number, driver_name, is_active').or(`truck_number.ilike.${q},driver_name.ilike.${q}`).limit(5),
      supabase.from('credit_parties').select('id, name, phone').eq('is_active', true).ilike('name', q).limit(5),
    ]);

    const combined: SearchResult[] = [
      ...(staffRes.data || []).map(s => ({ ...s, type: 'staff' as const })),
      ...(vehicleRes.data || []).map(v => ({ ...v, type: 'vehicle' as const })),
      ...(partyRes.data || []).map(p => ({ ...p, type: 'party' as const })),
    ];
    setResults(combined);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSelectStaff = (staffId: string, section: 'attendance' | 'advance' | 'profile') => {
    onSelectStaff?.(staffId, section);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 shadow-lg gap-2 text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, vehicles, parties..."
              className="border-0 focus-visible:ring-0 shadow-none text-sm h-12"
              autoFocus
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSearchQuery('')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result) => {
                  if (result.type === 'staff') {
                    const staff = result as StaffResult;
                    return (
                      <div key={`s-${staff.id}`} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{staff.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{staff.category}{staff.phone && ` · ${staff.phone}`}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Staff</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleSelectStaff(staff.id, 'attendance')}>
                            <Calendar className="h-3 w-3 mr-1" />Attendance
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleSelectStaff(staff.id, 'advance')}>
                            <Wallet className="h-3 w-3 mr-1" />Advance
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleSelectStaff(staff.id, 'profile')}>
                            <User className="h-3 w-3 mr-1" />Profile
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  if (result.type === 'vehicle') {
                    const v = result as VehicleResult;
                    return (
                      <div key={`v-${v.id}`} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-accent/20">
                          <Truck className="h-3.5 w-3.5 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium font-mono">{v.truck_number}</p>
                          <p className="text-[10px] text-muted-foreground">{v.driver_name || 'No driver assigned'}</p>
                        </div>
                        <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {v.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    );
                  }
                  if (result.type === 'party') {
                    const p = result as PartyResult;
                    return (
                      <div key={`p-${p.id}`} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-secondary/20">
                          <Users className="h-3.5 w-3.5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.phone || 'No phone'}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Party</Badge>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : searchQuery.trim() && !isSearching ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No results for "{searchQuery}"
              </p>
            ) : !searchQuery.trim() ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Search across staff, vehicles & credit parties</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Type to start searching...</p>
              </div>
            ) : null}
            {isSearching && (
              <p className="text-center text-xs text-muted-foreground py-4 animate-pulse">Searching...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
