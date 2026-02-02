import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Image, 
  Music,
  Trash2,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/sounds';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSettings } = useGame();

  const handleFileUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'background' | 'timer' | 'correct' | 'wrong'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      
      switch (type) {
        case 'background':
          updateSettings({ customBackground: base64 });
          break;
        case 'timer':
          updateSettings({ timerSound: base64 });
          break;
        case 'correct':
          updateSettings({ correctSound: base64 });
          break;
        case 'wrong':
          updateSettings({ wrongSound: base64 });
          break;
      }
      
      toast({ title: 'הועלה בהצלחה', description: 'הקובץ נשמר' });
    } catch {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן להעלות את הקובץ' });
    }
  }, [updateSettings, toast]);

  const clearSetting = (key: 'customBackground' | 'timerSound' | 'correctSound' | 'wrongSound') => {
    updateSettings({ [key]: undefined });
    toast({ title: 'נמחק', description: 'ההגדרה אופסה' });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">הגדרות</h1>
            <p className="text-muted-foreground mt-1">התאמה אישית של המשחק</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/setup')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
        </div>

        <div className="space-y-6">
          {/* Background Image */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">תמונת רקע</h3>
            </div>
            
            <div className="flex gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'background')}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {settings.customBackground ? 'החלף תמונה' : 'העלה תמונה'}
                  </p>
                </div>
              </label>
              
              {settings.customBackground && (
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-border">
                  <img 
                    src={settings.customBackground} 
                    alt="Background preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => clearSetting('customBackground')}
                    className="absolute top-1 left-1 p-1 bg-destructive rounded-full"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sounds */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Music className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">צלילים</h3>
            </div>
            
            <div className="space-y-4">
              {/* Timer Sound */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">צליל טיימר</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.timerSound ? 'צליל מותאם' : 'צליל ברירת מחדל'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'timer')}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>העלה</span>
                    </Button>
                  </label>
                  {settings.timerSound && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => clearSetting('timerSound')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Correct Sound */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">צליל תשובה נכונה</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.correctSound ? 'צליל מותאם' : 'צליל ברירת מחדל'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'correct')}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>העלה</span>
                    </Button>
                  </label>
                  {settings.correctSound && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => clearSetting('correctSound')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Wrong Sound */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">צליל תשובה שגויה</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.wrongSound ? 'צליל מותאם' : 'צליל ברירת מחדל'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'wrong')}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>העלה</span>
                    </Button>
                  </label>
                  {settings.wrongSound && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => clearSetting('wrongSound')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">הגדרות משחק</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">הצג ניקוד</p>
                  <p className="text-sm text-muted-foreground">הצגת נקודות לכל שאלה</p>
                </div>
                <Switch
                  checked={settings.showPoints}
                  onCheckedChange={(checked) => updateSettings({ showPoints: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">זמן ברירת מחדל (שניות)</p>
                  <p className="text-sm text-muted-foreground">לשאלות ללא זמן מוגדר</p>
                </div>
                <Input
                  type="number"
                  value={settings.defaultTimeLimit}
                  onChange={(e) => updateSettings({ defaultTimeLimit: parseInt(e.target.value) || 30 })}
                  className="w-20 text-center"
                  min={5}
                  max={120}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}