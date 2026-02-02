import { useEffect, useState, useRef, useMemo } from 'react';
import { getAudioIntensity } from '@/lib/sounds';

interface Dot {
  x: number;
  y: number;
  baseSize: number;
  delay: number;
}

export default function NeonBackground() {
  const [animationSpeed, setAnimationSpeed] = useState(1.5);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate dots with concave depth effect
  const dots = useMemo(() => {
    const result: Dot[] = [];
    const cols = 20;
    const rows = 12;
    const centerX = cols / 2;
    const centerY = rows / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate distance from center
        const dx = col - centerX;
        const dy = row - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize distance (0 = center, 1 = edge)
        const normalizedDistance = distance / maxDistance;
        
        // Size based on distance - larger at edges (concave effect)
        // Center dots: ~6px, Edge dots: ~18px
        const baseSize = 6 + (normalizedDistance * 12);
        
        result.push({
          x: (col / (cols - 1)) * 100,
          y: (row / (rows - 1)) * 100,
          baseSize,
          delay: Math.random() * 3, // Random delay for staggered animation
        });
      }
    }
    return result;
  }, []);

  useEffect(() => {
    const updateAnimation = () => {
      const intensity = getAudioIntensity();
      const newSpeed = Math.max(0.3, 1.5 - (intensity * 1.5));
      setAnimationSpeed(newSpeed);
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* רקע בורדו בסיסי */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: '#380202',
        }}
      />
      
      {/* נקודות עם אפקט עומק קעור */}
      <div className="absolute inset-0">
        {dots.map((dot, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: `${dot.baseSize}px`,
              height: `${dot.baseSize}px`,
              backgroundColor: '#631818',
              transform: 'translate(-50%, -50%)',
              animation: `dotPulse 3s ease-in-out ${dot.delay}s infinite`,
              boxShadow: `0 0 ${dot.baseSize / 2}px rgba(99, 24, 24, 0.5)`,
            }}
          />
        ))}
      </div>
      
      {/* שכבת הצללה לעומק נוסף */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(56, 2, 2, 0.3) 0%, rgba(56, 2, 2, 0.8) 100%)',
        }}
      />
      
      {/* מסגרת ניאון מסתובבת */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 10 }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* קו אדום */}
        <rect
          x="10"
          y="10"
          width="calc(100% - 20px)"
          height="calc(100% - 20px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="#ff003c"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="40 60"
          filter="url(#glow-red)"
          style={{
            animation: `neonBorderRed ${animationSpeed}s linear infinite`,
          }}
        />
        
        {/* קו כחול */}
        <rect
          x="10"
          y="10"
          width="calc(100% - 20px)"
          height="calc(100% - 20px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="#00eaff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="40 60"
          filter="url(#glow-blue)"
          style={{
            animation: `neonBorderBlue ${animationSpeed}s linear infinite`,
          }}
        />
      </svg>
      
      <style>{`
        @keyframes neonBorderRed {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -100; }
        }
        @keyframes neonBorderBlue {
          from { stroke-dashoffset: -50; }
          to { stroke-dashoffset: -150; }
        }
        @keyframes dotPulse {
          0%, 100% { 
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
