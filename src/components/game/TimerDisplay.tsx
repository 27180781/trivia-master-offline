import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { stopSound } from '@/lib/sounds';

interface TimerDisplayProps {
  duration: number;
}

export default function TimerDisplay({ duration }: TimerDisplayProps) {
  const { playSoundEffect, isMuted } = useGame();
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isUrgent, setIsUrgent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  // Start continuous timer sound when component mounts
  useEffect(() => {
    if (!isMuted && !hasStartedRef.current) {
      hasStartedRef.current = true;
      // Play the timer sound continuously
      playSoundEffect('tick');
    }

    return () => {
      // Stop timer sound when component unmounts
      stopSound('tick');
      hasStartedRef.current = false;
    };
  }, [isMuted, playSoundEffect]);

  // Timer countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 0.1;
        
        // Set urgent mode for last 5 seconds
        if (newTime <= 5 && !isUrgent) {
          setIsUrgent(true);
        }
        
        if (newTime <= 0) {
          clearInterval(interval);
          // Stop timer sound when timer reaches 0
          stopSound('tick');
          return 0;
        }
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, isUrgent]);

  const progress = (timeLeft / duration) * 100;
  const displayTime = Math.ceil(timeLeft);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      {/* Time Display */}
      <div className="text-center mb-4">
        <motion.span
          className={cn(
            'text-6xl md:text-7xl font-bold tabular-nums',
            isUrgent && 'text-game-timer animate-timer-pulse'
          )}
          animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        >
          {displayTime}
        </motion.span>
        <span className="text-2xl text-muted-foreground mr-2">שניות</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-y-0 right-0 rounded-full transition-colors duration-300',
            progress > 50 && 'bg-gradient-success',
            progress <= 50 && progress > 20 && 'bg-gradient-warning',
            progress <= 20 && 'bg-destructive'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
        
        {/* Glow effect when urgent */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-destructive/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Urgent warning */}
      {isUrgent && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-game-timer mt-4 text-lg font-medium"
        >
          ⏰ הזמן אוזל!
        </motion.p>
      )}
    </motion.div>
  );
}
