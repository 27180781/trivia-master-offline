import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateAdminPin } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface AdminPinEntryProps {
  onSuccess: () => void;
}

export default function AdminPinEntry({ onSuccess }: AdminPinEntryProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (validateAdminPin(pin)) {
      onSuccess();
    } else {
      toast({
        variant: 'destructive',
        title: 'קוד שגוי',
        description: 'קוד PIN לא נכון',
      });
      setPin('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-4"
            >
              <Lock className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">פאנל ניהול</h1>
            <p className="text-muted-foreground">הזן קוד PIN לגישה</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl tracking-[1em] h-14"
              maxLength={10}
              dir="ltr"
            />

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading || !pin.trim()}
            >
              {isLoading ? 'בודק...' : 'כניסה'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לדף הראשי
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}