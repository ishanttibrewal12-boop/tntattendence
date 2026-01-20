import { useState, useEffect } from 'react';
import { Search, X, User, Calendar, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
  id: string;
  name: string;
  category: string;
  phone: string | null;
}

interface GlobalSearchProps {
  onSelectStaff?: (staffId: string, section: 'attendance' | 'advance' | 'profile') => void;
}

const GlobalSearch = ({ onSelectStaff }: GlobalSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  useEffect(() => {
    if (isOpen && staffList.length === 0) {
      fetchStaff();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone && staff.phone.includes(searchQuery))
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff([]);
    }
  }, [searchQuery, staffList]);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, name, category, phone')
      .eq('is_active', true)
      .order('name');
    
    if (data) setStaffList(data as Staff[]);
  };

  const handleSelect = (staffId: string, section: 'attendance' | 'advance' | 'profile') => {
    if (onSelectStaff) {
      onSelectStaff(staffId, section);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50 shadow-lg">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Staff</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or phone..."
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {filteredStaff.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredStaff.map((staff) => (
                <Card key={staff.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{staff.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {staff.category} {staff.phone && `• ${staff.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSelect(staff.id, 'attendance')}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Attendance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSelect(staff.id, 'advance')}
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        Advance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSelect(staff.id, 'profile')}
                      >
                        <User className="h-3 w-3 mr-1" />
                        Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No staff found matching "{searchQuery}"
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Start typing to search...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
