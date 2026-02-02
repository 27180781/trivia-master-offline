import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StandbyScreenProps {
  onStart: () => void;
}

export default function StandbyScreen({ onStart }: StandbyScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <h1 className="text-6xl md:text-8xl font-bold text-gradient">טריוויה</h1>
      </motion.div>
      
      <p className="text-xl md:text-2xl text-muted-foreground mb-12">
        לחץ להתחלה או השתמש במקשי החיצים
      </p>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className="h-20 px-12 text-2xl bg-gradient-primary hover:opacity-90"
          onClick={onStart}
        >
          <Play className="w-8 h-8 ml-3" />
          התחל
        </Button>
      </motion.div>

      <div className="mt-12 text-muted-foreground text-sm space-y-1">
        <p>← / רווח = הבא | → = חזור</p>
        <p>↑ = שאלה קודמת | ↓ = שאלה הבאה</p>
        <p>ESC = יציאה ממסך מלא</p>
      </div>
    </motion.div>
  );
}