// Sound configuration
// These sounds are fixed MP3 files that are always used (even in packaged versions)
const TIMER_SOUND_URL = '/sounds/timer.mp3';
const REVEAL_SOUND_URL = '/sounds/reveal.mp3';

// Built-in sounds
const SOUNDS = {
  tick: TIMER_SOUND_URL,
  correct: REVEAL_SOUND_URL,
  wrong: 'data:audio/wav;base64,UklGRrQFAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YZAFAACAgICBhIqRl5qYkIN4bmZhYmhweYKKjpCOiIN6cGllY2RobHN7g4qOj46JgnlvZmNiZGltdX2EioyMioR8c2tmY2RnaW53foWKjI2LhX54cGpmZGVoa3N6gYeKjIqGgHlxamVkZGdscnl/hYmLioaDe3NsZ2RkZWhudH2Dh4qKh4J8dW5pZmVlaG10fYOHiomFgHpzbWdkZGVob3V9g4eJiIR+eHFrZmRkZmtxeH+Eh4iGgn14cWtmZGVma3J5f4SHiIaCfHZvamZlZWdscnl/hIeHhYF7dG5pZmVlZ2xzeoGFh4eDfnhybGhlZWZqcHd+g4aGhIB6c21oZmVmaW90e4GFhoSAfHZwa2dlZWdrcnd+goWGg399d3FsaGZlZ2twd36ChaWFgn55c21oZmVmaG10e4GEhYOAfHZwamZlZWdqcHd9gYSDgn55c25pZmVlZ2pweH2BhIOBfnlzbWhmZWVnaXB2fIGEg4F9eHJsaGZlZmhsc3l+goOCgHx2cGplZWVnamxzeX6BgoF+enRuaWZlZWdpcHV7foGBf3x3cm1oZmVlZ2pwdXt+gYF/fHdybWhmZWVnaG91e36AgX99eHJtaGZlZWdobHN4fH+AgH16dXBrZ2VlZmhscnd8f4B/fXp1cGtnZWVmZ2twd3t+f399eXRwa2dlZWZnamx0d3t9fn16dnJuaWdlZWZoam50d3p8fXt4dHBsaGZlZWdpbHF1eXt8e3l1cW1qZ2ZlZmdpbHB0d3p7e3l2cm9sameWZmdpam5ydnh7e3p3dHBta2lnZmZnaWttcHN2eHl4dnNwbWpnZmZmaGptcHN2eHl4dnNwbWpnZmZmaGptcHN2eHl4dnNwbWpnZmZmaGpt',
};

// Active audio instances for stopping
let activeTimerAudio: HTMLAudioElement | null = null;
let activeRevealAudio: HTMLAudioElement | null = null;

// Audio context and analyser for reactive animations
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let audioSource: MediaElementAudioSourceNode | null = null;

// Get audio analyser for reactive animations
export function getAudioAnalyser(): AnalyserNode | null {
  return analyser;
}

// Get current audio intensity (0-1)
export function getAudioIntensity(): number {
  if (!analyser) return 0;
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average intensity
  const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
  return average / 255;
}

// Stop all currently playing sounds
export function stopAllSounds(): void {
  if (activeTimerAudio) {
    activeTimerAudio.pause();
    activeTimerAudio.currentTime = 0;
    activeTimerAudio = null;
  }
  if (activeRevealAudio) {
    activeRevealAudio.pause();
    activeRevealAudio.currentTime = 0;
    activeRevealAudio = null;
  }
}

// Stop specific sound type
export function stopSound(type: 'tick' | 'correct'): void {
  if (type === 'tick' && activeTimerAudio) {
    activeTimerAudio.pause();
    activeTimerAudio.currentTime = 0;
    activeTimerAudio = null;
  }
  if (type === 'correct' && activeRevealAudio) {
    activeRevealAudio.pause();
    activeRevealAudio.currentTime = 0;
    activeRevealAudio = null;
  }
}

export function playSound(type: 'tick' | 'correct' | 'wrong', customSoundUrl?: string): void {
  // For tick and correct sounds, always use the built-in sounds (ignore custom)
  const url = (type === 'tick' || type === 'correct') ? SOUNDS[type] : (customSoundUrl || SOUNDS[type]);
  
  const audio = new Audio(url);
  audio.volume = 0.5;
  
  // Track active audio for stopping
  if (type === 'tick') {
    // Stop previous timer sound before playing new one
    if (activeTimerAudio) {
      activeTimerAudio.pause();
      activeTimerAudio.currentTime = 0;
    }
    activeTimerAudio = audio;
    
    // Setup audio analyser for reactive animations
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
      }
      
      // Create analyser if needed
      if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioContext.destination);
      }
      
      // Disconnect previous source
      if (audioSource) {
        audioSource.disconnect();
      }
      
      // Connect new audio to analyser
      audioSource = audioContext.createMediaElementSource(audio);
      audioSource.connect(analyser);
    } catch (e) {
      console.error('Failed to setup audio analyser:', e);
    }
  } else if (type === 'correct') {
    // Stop previous reveal sound before playing new one
    if (activeRevealAudio) {
      activeRevealAudio.pause();
      activeRevealAudio.currentTime = 0;
    }
    activeRevealAudio = audio;
  }
  
  audio.play().catch(console.error);
  
  // Clean up reference when audio ends
  audio.addEventListener('ended', () => {
    if (type === 'tick' && activeTimerAudio === audio) {
      activeTimerAudio = null;
    } else if (type === 'correct' && activeRevealAudio === audio) {
      activeRevealAudio = null;
    }
  });
}

export function playTickingSound(durationMs: number, onTick?: () => void): { stop: () => void } {
  let stopped = false;
  let tickCount = 0;
  const maxTicks = Math.floor(durationMs / 1000);
  
  const interval = setInterval(() => {
    if (stopped || tickCount >= maxTicks) {
      clearInterval(interval);
      return;
    }
    
    playSound('tick');
    onTick?.();
    tickCount++;
    
    // Speed up ticking in last 5 seconds
    if (tickCount >= maxTicks - 5) {
      clearInterval(interval);
      const fastInterval = setInterval(() => {
        if (stopped || tickCount >= maxTicks) {
          clearInterval(fastInterval);
          return;
        }
        playSound('tick');
        onTick?.();
        tickCount++;
      }, 500);
    }
  }, 1000);
  
  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
      stopSound('tick');
    },
  };
}

// Convert file to base64 for storage
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
