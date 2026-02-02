import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateLicense, useLicense, isUnlocked } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function LicenseEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLockedMode } = useGame();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If in locked mode, redirect directly to game
  useEffect(() => {
    if (isLockedMode) {
      navigate('/game', { replace: true });
      return;
    }
    // If already unlocked, redirect to setup
    if (isUnlocked()) {
      navigate('/setup', { replace: true });
    }
  }, [navigate, isLockedMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const validation = validateLicense(code);
    
    if (validation.valid) {
      const success = useLicense(code);
      if (success) {
        toast({
          title: 'הצלחה!',
          description: 'קוד הרישיון אומת בהצלחה',
        });
        navigate('/setup');
      } else {
        toast({
          variant: 'destructive',
          title: 'שגיאה',
          description: 'אירעה שגיאה בהפעלת הרישיון',
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'קוד לא תקין',
        description: validation.message,
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PWAInstallPrompt />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-4"
            >
              <ShieldCheck className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">מערכת טריוויה</h1>
            <p className="text-muted-foreground">הזן קוד רישיון להפעלת המערכת</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pr-12 text-center text-lg tracking-widest font-mono h-14"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? 'מאמת...' : 'הפעל רישיון'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/admin')}
            >
              <Settings className="w-4 h-4 ml-2" />
              ניהול מערכת
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          אין לך קוד רישיון? פנה למנהל המערכת
        </p>
      </motion.div>
    </div>
  );
}