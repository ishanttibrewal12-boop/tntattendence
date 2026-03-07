import { useState, useEffect } from 'react';
import { MessageCircle, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WhatsAppSettingsSection = () => {
  const [numbers, setNumbers] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_numbers')
        .single();

      if (data?.setting_value) {
        const parsed = JSON.parse(data.setting_value);
        setNumbers(Array.isArray(parsed) ? parsed : []);
      } else {
        // Set default number
        setNumbers(['+916203229118']);
      }
    } catch {
      setNumbers(['+916203229118']);
    }
  };

  const saveNumbers = async (updatedNumbers: string[]) => {
    setIsSaving(true);
    try {
      const value = JSON.stringify(updatedNumbers);
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', 'whatsapp_numbers')
        .single();

      let error;
      if (existing) {
        const result = await supabase
          .from('app_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('setting_key', 'whatsapp_numbers');
        error = result.error;
      } else {
        const result = await supabase
          .from('app_settings')
          .insert({ setting_key: 'whatsapp_numbers', setting_value: value });
        error = result.error;
      }

      if (error) {
        toast.error('Failed to save WhatsApp numbers');
      } else {
        setNumbers(updatedNumbers);
        toast.success('WhatsApp numbers saved');
      }
    } catch {
      toast.error('Failed to save');
    }
    setIsSaving(false);
  };

  const handleAddNumber = () => {
    const cleaned = newNumber.trim().replace(/\s/g, '');
    if (!cleaned) return;

    // Basic validation: must start with + and have digits
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      toast.error('Enter a valid phone number (e.g., +916203229118)');
      return;
    }

    const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

    if (numbers.includes(formatted)) {
      toast.error('Number already added');
      return;
    }

    const updated = [...numbers, formatted];
    saveNumbers(updated);
    setNewNumber('');
  };

  const handleRemoveNumber = (index: number) => {
    const updated = numbers.filter((_, i) => i !== index);
    saveNumbers(updated);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Notifications
        </CardTitle>
        <CardDescription>
          Manage phone numbers for WhatsApp dispatch & bolder notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current numbers */}
        {numbers.length > 0 ? (
          <div className="space-y-2">
            <Label>Active Numbers</Label>
            {numbers.map((num, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono">
                  {num}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemoveNumber(i)}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No numbers configured</p>
        )}

        {/* Add new number */}
        <div className="border-t pt-4">
          <Label>Add Number</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="font-mono"
            />
            <Button
              onClick={handleAddNumber}
              disabled={!newNumber.trim() || isSaving}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Include country code (e.g., +916203229118)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppSettingsSection;
