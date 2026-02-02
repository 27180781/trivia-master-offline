import { motion } from 'framer-motion';
import { TriviaQuestion } from '@/types';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionsDisplayProps {
  question: TriviaQuestion;
  showOptions: boolean;
  showCorrect: boolean;
}

const optionLabels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

// Fixed background colors for each option circle
const optionColors = [
  'bg-green-500',   // א - ירוק
  'bg-red-500',     // ב - אדום
  'bg-yellow-400',  // ג - צהוב
  'bg-white',       // ד - לבן
  'bg-orange-500',  // ה - כתום
  'bg-purple-500',  // ו - סגול
];

export default function OptionsDisplay({ 
  question, 
  showOptions, 
  showCorrect 
}: OptionsDisplayProps) {
  const gridCols = question.answers.length <= 4 
    ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showOptions ? 1 : 0 }}
      className={cn('grid gap-4', gridCols)}
    >
      {question.answers.map((answer, index) => {
        const isCorrect = !question.isSurvey && question.correctAnswerIndex === index;
        const showAsCorrect = showCorrect && isCorrect;
        const showAsWrong = showCorrect && !isCorrect && !question.isSurvey;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -50 }}
            animate={{ 
              opacity: showOptions ? 1 : 0, 
              x: showOptions ? 0 : -50,
              scale: showAsCorrect ? [1, 1.05, 1] : 1,
            }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.3,
              scale: { duration: 0.5, repeat: showAsCorrect ? 2 : 0 }
            }}
            className={cn(
              'relative p-6 rounded-xl border-2 transition-all duration-300',
              !showCorrect && 'bg-game-option border-transparent hover:bg-game-option-hover',
              showAsCorrect && 'bg-game-correct/20 border-game-correct shadow-lg shadow-game-correct/20',
              showAsWrong && 'bg-destructive/10 border-destructive/30 opacity-60',
              question.isSurvey && showCorrect && 'bg-game-survey/20 border-game-survey/30'
            )}
          >
            <div className="flex items-center gap-4">
              <span className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0',
                optionColors[index] || 'bg-primary/20',
                showAsCorrect && 'ring-4 ring-game-correct',
                showAsWrong && 'opacity-60',
                question.isSurvey && showCorrect && 'ring-2 ring-game-survey/50'
              )}>
                {showAsCorrect ? (
                  <Check className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 1px black)' }} />
                ) : showAsWrong ? (
                  <X className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 1px black)' }} />
                ) : (
                  <span 
                    className="text-white font-bold"
                    style={{ 
                      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                    }}
                  >
                    {optionLabels[index]}
                  </span>
                )}
              </span>
              
              <span className={cn(
                'text-xl md:text-2xl font-medium',
                showAsCorrect && 'text-game-correct',
                showAsWrong && 'text-muted-foreground'
              )}>
                {answer}
              </span>
            </div>

            {/* Correct answer glow effect */}
            {showAsCorrect && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-game-correct/10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}