import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Camera, Image, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyPhoto {
  id: string;
  date: string;
  photo_url: string;
  notes: string | null;
}

interface PhotoGallerySectionProps {
  onBack: () => void;
}

const PhotoGallerySection = ({ onBack }: PhotoGallerySectionProps) => {
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DailyPhoto | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<DailyPhoto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('daily_photos')
      .select('*')
      .order('date', { ascending: false });

    if (data) setPhotos(data);
    if (error) toast.error('Failed to load photos');
    setIsLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `daily/${format(selectedDate, 'yyyy-MM-dd')}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('daily_photos')
        .insert({
          date: format(selectedDate, 'yyyy-MM-dd'),
          photo_url: urlData.publicUrl,
          notes: notes || null,
        });

      if (insertError) throw insertError;

      toast.success('Photo uploaded successfully');
      setDialogOpen(false);
      resetForm();
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase
      .from('daily_photos')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast.error('Failed to delete photo');
      return;
    }

    toast.success('Photo deleted');
    setDeleteConfirm(null);
    fetchPhotos();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNotes('');
    setSelectedDate(new Date());
  };

  // Group photos by date
  const groupedPhotos = photos.reduce((groups, photo) => {
    const date = photo.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(photo);
    return groups;
  }, {} as Record<string, DailyPhoto[]>);

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Photo Gallery</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Daily Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Date Selection */}
              <div>
                <Label>Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Photo Selection */}
              <div>
                <Label>Photo</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-1"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Camera</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-6 w-6" />
                    <span className="text-xs">Gallery</span>
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={uploadPhoto}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No photos yet</p>
          <p className="text-sm">Add daily photos to keep a record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(date), 'dd MMM yyyy, EEEE')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {datePhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Daily photo"
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => setViewPhoto(photo)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(photo); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {photo.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{photo.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Photo Dialog */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewPhoto && format(new Date(viewPhoto.date), 'dd MMM yyyy')}</DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <div className="space-y-3">
              <img
                src={viewPhoto.photo_url}
                alt="Daily photo"
                className="w-full rounded-lg"
              />
              {viewPhoto.notes && (
                <p className="text-sm text-muted-foreground">{viewPhoto.notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePhoto}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhotoGallerySection;
