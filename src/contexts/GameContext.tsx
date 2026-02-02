import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TriviaQuestion, GamePhase, GameSettings, GamePackage } from '@/types';
import { getGameSettings, saveGameSettings } from '@/lib/storage';
import { playSound, stopAllSounds, stopSound } from '@/lib/sounds';
import embeddedGameData from '@/data/embedded-game.json';

interface GameContextType {
  questions: TriviaQuestion[];
  setQuestions: (questions: TriviaQuestion[]) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  currentQuestion: TriviaQuestion | null;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  nextStep: () => void;
  prevStep: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  resetGame: () => void;
  playSoundEffect: (type: 'tick' | 'correct' | 'wrong') => void;
  isLockedMode: boolean;
}

// Check if running in locked mode (embedded game with questions)
let embeddedGame: GamePackage | { questions: never[] } = { questions: [] };
let isLockedMode = false;

try {
  embeddedGame = embeddedGameData as GamePackage | { questions: never[] };
  isLockedMode = !!(embeddedGame?.questions && embeddedGame.questions.length > 0);
} catch (e) {
  console.warn('Could not load embedded game data:', e);
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Initialize with embedded game if in locked mode
  const [questions, setQuestions] = useState<TriviaQuestion[]>(() => {
    if (isLockedMode && embeddedGame.questions) {
      return embeddedGame.questions as TriviaQuestion[];
    }
    return [];
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Start at 'options' phase in locked mode (skip standby)
  const [phase, setPhase] = useState<GamePhase>(isLockedMode ? 'options' : 'standby');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const stored = getGameSettings();
    // Apply embedded game settings if in locked mode
    if (isLockedMode && 'settings' in embeddedGame && embeddedGame.settings) {
      return {
        ...stored,
        ...embeddedGame.settings,
        customBackground: embeddedGame.assets?.background || stored.customBackground,
        timerSound: embeddedGame.assets?.sounds?.timer || stored.timerSound,
        correctSound: embeddedGame.assets?.sounds?.correct || stored.correctSound,
        wrongSound: embeddedGame.assets?.sounds?.wrong || stored.wrongSound,
      };
    }
    return stored;
  });

  const currentQuestion = questions[currentQuestionIndex] || null;

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveGameSettings(updated);
      return updated;
    });
  }, []);

  const playSoundEffect = useCallback((type: 'tick' | 'correct' | 'wrong') => {
    if (isMuted) return;
    
    let customSound: string | undefined;
    if (type === 'tick') customSound = settings.timerSound;
    else if (type === 'correct') customSound = settings.correctSound;
    else if (type === 'wrong') customSound = settings.wrongSound;
    
    playSound(type, customSound);
  }, [isMuted, settings]);

  const nextStep = useCallback(() => {
    // Flow for text-only slides: options -> next question (no answers, timer, or reveal)
    // Flow for regular/survey: standby -> options -> answers -> timer -> reveal
    
    // Handle text-only slides - skip directly to next question
    if (currentQuestion?.isTextOnly && phase === 'options') {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setPhase('options');
      }
      return;
    }
    
    const phases: GamePhase[] = ['standby', 'options', 'answers', 'timer', 'reveal'];
    const currentIndex = phases.indexOf(phase);
    
    // Stop timer sound when leaving timer phase
    if (phase === 'timer') {
      stopSound('tick');
    }
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setPhase(nextPhase);
      
      // Play correct/wrong sound on reveal for non-survey questions
      if (nextPhase === 'reveal' && currentQuestion && !currentQuestion.isSurvey) {
        playSoundEffect('correct');
      }
    } else {
      // If at reveal, go to next question - stop reveal sound first
      stopSound('correct');
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setPhase('options');
      }
    }
  }, [phase, currentQuestionIndex, questions.length, currentQuestion, playSoundEffect]);

  const prevStep = useCallback(() => {
    // Flow: standby -> options (question only) -> answers (question + answers) -> timer -> reveal
    const phases: GamePhase[] = ['standby', 'options', 'answers', 'timer', 'reveal'];
    const currentIndex = phases.indexOf(phase);
    
    // Stop sounds when going back
    if (phase === 'timer') {
      stopSound('tick');
    } else if (phase === 'reveal') {
      stopSound('correct');
    }
    
    if (currentIndex > 0) {
      setPhase(phases[currentIndex - 1]);
    }
  }, [phase]);

  const nextQuestion = useCallback(() => {
    stopAllSounds(); // Stop all sounds when jumping to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('options');
    }
  }, [currentQuestionIndex, questions.length]);

  const prevQuestion = useCallback(() => {
    stopAllSounds(); // Stop all sounds when jumping to previous question
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setPhase('options');
    }
  }, [currentQuestionIndex]);

  const resetGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setPhase('standby');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'standby') return;
      
      switch (e.key) {
        case 'ArrowRight':
          prevStep();
          break;
        case 'ArrowLeft':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowUp':
          prevQuestion();
          break;
        case 'ArrowDown':
          nextQuestion();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, nextStep, prevStep, nextQuestion, prevQuestion, isFullscreen, toggleFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <GameContext.Provider
      value={{
        questions,
        setQuestions,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        currentQuestion,
        phase,
        setPhase,
        isFullscreen,
        toggleFullscreen,
        isMuted,
        toggleMute,
        settings,
        updateSettings,
        nextStep,
        prevStep,
        nextQuestion,
        prevQuestion,
        resetGame,
        playSoundEffect,
        isLockedMode,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}