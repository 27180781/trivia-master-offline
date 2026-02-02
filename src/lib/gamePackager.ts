import { TriviaQuestion, GameSettings, GamePackage, GamePackageMeta } from '@/types';
import { getGameSettings } from './storage';

/**
 * Creates a game package from current questions and settings
 */
export function createGamePackage(
  name: string,
  questions: TriviaQuestion[],
  customLogo?: string
): GamePackage {
  const settings = getGameSettings();
  
  const meta: GamePackageMeta = {
    name,
    createdAt: new Date().toISOString(),
    version: '1.0',
    questionCount: questions.length,
  };

  const assets: GamePackage['assets'] = {};
  
  if (settings.customBackground) {
    assets.background = settings.customBackground;
  }
  
  if (customLogo) {
    assets.logo = customLogo;
  }
  
  if (settings.timerSound) {
    assets.sounds = assets.sounds || {};
    assets.sounds.timer = settings.timerSound;
  }
  
  if (settings.correctSound) {
    assets.sounds = assets.sounds || {};
    assets.sounds.correct = settings.correctSound;
  }
  
  if (settings.wrongSound) {
    assets.sounds = assets.sounds || {};
    assets.sounds.wrong = settings.wrongSound;
  }

  return {
    meta,
    questions,
    settings: {
      defaultTimeLimit: settings.defaultTimeLimit,
      showPoints: settings.showPoints,
    },
    assets: Object.keys(assets).length > 0 ? assets : undefined,
  };
}

/**
 * Exports game package to a downloadable .bravo file
 */
export function exportGamePackage(gamePackage: GamePackage): void {
  const jsonString = JSON.stringify(gamePackage, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${gamePackage.meta.name.replace(/\s+/g, '_')}.bravo`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports a game package from a .bravo file
 */
export function importGamePackage(file: File): Promise<GamePackage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const gamePackage = JSON.parse(content) as GamePackage;
        
        // Validate the package structure
        if (!gamePackage.meta || !gamePackage.questions || !Array.isArray(gamePackage.questions)) {
          throw new Error('מבנה קובץ לא תקין');
        }
        
        if (gamePackage.questions.length === 0) {
          throw new Error('הקובץ לא מכיל שאלות');
        }
        
        resolve(gamePackage);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('שגיאה בקריאת הקובץ'));
      }
    };
    
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file);
  });
}

/**
 * Checks if the app is running in locked mode (embedded game exists)
 */
export async function checkLockedMode(): Promise<GamePackage | null> {
  try {
    const embeddedGame = await import('@/data/embedded-game.json');
    
    if (embeddedGame.questions && embeddedGame.questions.length > 0) {
      return embeddedGame as GamePackage;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates embedded-game.json content for packaging
 */
export function generateEmbeddedGameContent(gamePackage: GamePackage): string {
  return JSON.stringify(gamePackage, null, 2);
}
