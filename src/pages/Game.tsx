import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize,
  Volume2,
  VolumeX,
  Home,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import OptionsDisplay from '@/components/game/OptionsDisplay';
import TimerDisplay from '@/components/game/TimerDisplay';
import StandbyScreen from '@/components/game/StandbyScreen';
import NeonBackground from '@/components/game/NeonBackground';

export default function GamePage() {
  const navigate = useNavigate();
  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    phase,
    setPhase,
    isFullscreen,
    toggleFullscreen,
    isMuted,
    toggleMute,
    nextStep,
    prevStep,
    nextQuestion,
    prevQuestion,
    settings,
    isLockedMode,
  } = useGame();

  const [showControls, setShowControls] = useState(true);

  // Redirect if no questions (only in non-locked mode)
  useEffect(() => {
    if (questions.length === 0 && !isLockedMode) {
      navigate('/setup', { replace: true });
    }
  }, [questions, navigate, isLockedMode]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
    };
  }, []);

  // Start game on first load
  useEffect(() => {
    if (phase === 'standby' && questions.length > 0) {
      // Keep in standby until user advances
    }
  }, [phase, questions]);

  if (!currentQuestion) return null;

  const backgroundStyle = settings.customBackground 
    ? { backgroundImage: `url(${settings.customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="game-fullscreen flex flex-col"
      style={backgroundStyle}
    >
      {/* Neon animated background */}
      {!settings.customBackground && <NeonBackground />}
      
      {/* Background overlay for custom backgrounds */}
      {settings.customBackground && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}

      {/* Bravo Logo - bottom left corner */}
      <img 
        src="/images/bravo-logo.png" 
        alt="Bravo" 
        className="absolute bottom-4 left-4 w-24 h-24 opacity-60 z-10 pointer-events-none"
      />

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {phase === 'standby' && (
            <StandbyScreen key="standby" onStart={nextStep} />
          )}

          {(phase === 'options' || phase === 'answers' || phase === 'timer' || phase === 'reveal') && (
            <motion.div
              key={`full-${currentQuestionIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl"
            >
              <QuestionDisplay 
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                compact={true}
              />
              
              {/* Hide options and timer for text-only slides */}
              {!currentQuestion.isTextOnly && (
                <>
                  {/* Show options in answers, timer and reveal phases */}
                  <OptionsDisplay 
                    question={currentQuestion}
                    showOptions={phase === 'answers' || phase === 'timer' || phase === 'reveal'}
                    showCorrect={phase === 'reveal'}
                  />

                  {phase === 'timer' && (
                    <TimerDisplay duration={currentQuestion.timeLimit} />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                {/* Hide home button in locked mode */}
                {!isLockedMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/setup')}
                    title="חזרה לתפריט"
                  >
                    <Home className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  title={isMuted ? 'הפעל צלילים' : 'השתק'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'צא ממסך מלא' : 'מסך מלא'}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  title="שאלה קודמת"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevStep}
                  disabled={phase === 'standby'}
                  title="שלב קודם"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="px-4 py-2 bg-secondary rounded-lg text-center min-w-[100px]">
                  <p className="text-lg font-bold">{currentQuestionIndex + 1} / {questions.length}</p>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextStep}
                  title="שלב הבא"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  title="שאלה הבאה"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
              </div>

              {/* Right - Phase Indicator */}
              <div className="text-sm text-muted-foreground">
                {phase === 'standby' && 'המתנה'}
                {phase === 'options' && (currentQuestion?.isTextOnly ? 'טקסט' : 'שאלה')}
                {phase === 'answers' && 'תשובות'}
                {phase === 'timer' && 'ספירה'}
                {phase === 'reveal' && 'חשיפה'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}