import { motion } from 'framer-motion';
import { TriviaQuestion } from '@/types';
import { HelpCircle, BarChart3, FileText } from 'lucide-react';

interface QuestionDisplayProps {
  question: TriviaQuestion;
  questionNumber: number;
  totalQuestions: number;
  compact?: boolean;
}

export default function QuestionDisplay({ 
  question, 
  questionNumber, 
  totalQuestions,
  compact = false 
}: QuestionDisplayProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="px-3 py-1 bg-primary/20 rounded-full text-sm">
            {questionNumber} / {totalQuestions}
          </span>
          {question.isTextOnly && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-1">
              <FileText className="w-4 h-4" />
              טקסט
            </span>
          )}
          {question.isSurvey && !question.isTextOnly && (
            <span className="px-3 py-1 bg-game-survey/20 text-game-survey rounded-full text-sm flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              סקר
            </span>
          )}
          {question.points && !question.isTextOnly && (
            <span className="px-3 py-1 bg-game-timer/20 text-game-timer rounded-full text-sm">
              {question.points} נקודות
            </span>
          )}
        </div>
        <h2 className={`font-bold leading-relaxed whitespace-pre-wrap ${question.isTextOnly ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
          {question.question}
        </h2>
        {question.isTextOnly && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-muted-foreground text-lg"
          >
            לחץ להמשך...
          </motion.p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center max-w-4xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 mb-8"
      >
        <span className="px-4 py-2 bg-primary/20 rounded-full text-lg">
          שאלה {questionNumber} מתוך {totalQuestions}
        </span>
        {question.isSurvey && (
          <span className="px-4 py-2 bg-game-survey/20 text-game-survey rounded-full text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            שאלת סקר
          </span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-relaxed whitespace-pre-wrap">
            {question.question}
          </h1>
          
          {question.points && (
            <p className="mt-6 text-xl text-game-timer">
              🏆 {question.points} נקודות
            </p>
          )}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-muted-foreground text-lg"
      >
        לחץ להמשך...
      </motion.p>
    </motion.div>
  );
}