import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BloomEffectProps {
  milestone: number; // 25, 50, 75, or 100
  onComplete: () => void;
}

interface Petal {
  id: number;
  angle: number;
  delay: number;
  windOffset: number; // Horizontal drift during fall
}

export const BloomEffect: React.FC<BloomEffectProps> = ({ milestone, onComplete }) => {
  // Cherry blossom for 25% and 75%, classic bloom for 50% and 100%
  const isCherry = milestone === 25 || milestone === 75;
  const [fallenPetals, setFallenPetals] = useState<Array<{ id: number; x: number; rotation: number }>>([]);
  
  const [petals] = useState<Petal[]>(() => 
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      angle: (i * 72) - 90, // 5 petals evenly spaced, starting from top
      delay: i * 0.08,
      windOffset: (Math.random() - 0.5) * 200, // Random horizontal drift
    }))
  );
  
  const [sparkles] = useState(() => 
    Array.from({ length: isCherry ? 20 : 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 160 - 80,
      y: Math.random() * 160 - 80,
      delay: Math.random() * 0.4,
      size: Math.random() * 2 + 2,
    }))
  );

  useEffect(() => {
    // Animation phases compressed to 3 seconds total
    // Auto-dismiss immediately after animation
    
    // Capture fallen petal positions when they land
    const landingTimer = setTimeout(() => {
      const landed = petals.map((petal) => ({
        id: petal.id,
        x: petal.windOffset + 30,
        rotation: petal.angle + 400 + (Math.random() * 60 - 30),
      }));
      setFallenPetals(landed);
    }, 2800); // Just before animation completes
    
    // Animation completes at 3s, dismiss immediately
    const timer = setTimeout(onComplete, 3000); // 3s animation
    
    // ESC key handler for quick skip
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(landingTimer);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onComplete, petals]);

  const messages = {
    25: "First Blooms Appear 🌸",
    50: "Halfway to Fullness 🌺",
    75: "Blossoms Flourish 🌸",
    100: "Your Tree Stands Complete 🌹"
  };

  const cherryColors = {
    petal: 'from-pink-200 via-pink-300 to-pink-400',
    center: 'from-pink-100 to-pink-300',
    glow: 'shadow-pink-200/50',
  };

  const bloomColors = {
    petal: 'from-pink-300 via-pink-400 to-pink-500',
    center: 'from-yellow-300 to-yellow-500',
    glow: 'shadow-pink-300/50',
  };

  const colors = isCherry ? cherryColors : bloomColors;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm cursor-pointer select-none"
        onClick={onComplete}
      >
        {/* Fallen petals on ground - persist after animation */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
          {fallenPetals.map((fallen) => (
            <div
              key={`fallen-${fallen.id}`}
              className="absolute bottom-4"
              style={{
                left: `calc(50% + ${fallen.x}px)`,
                transform: `rotate(${fallen.rotation}deg)`,
              }}
            >
              <div 
                className={`${isCherry ? 'w-8 h-12' : 'w-10 h-14'} rounded-t-full bg-gradient-to-b ${colors.petal} shadow-md opacity-70`}
                style={{
                  clipPath: 'ellipse(50% 60% at 50% 40%)',
                }}
              />
            </div>
          ))}
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          {/* Sparkles - Throughout animation */}
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute rounded-full"
              style={{ 
                left: '50%', 
                top: '50%',
                width: sparkle.size,
                height: sparkle.size,
                backgroundColor: isCherry ? '#FFC0CB' : '#FFA5C0',
              }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0],
                x: sparkle.x,
                y: sparkle.y,
              }}
              transition={{ 
                duration: 1.2,
                delay: sparkle.delay,
                ease: "easeOut",
                times: [0, 0.2, 0.7, 1]
              }}
            />
          ))}

          {/* Flower Center - Appears during opening phase */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1],
            }}
            transition={{ 
              duration: 1.4,
              delay: 0.6, // Starts at 600ms (opening phase)
              ease: "backOut",
              times: [0, 0.6, 1]
            }}
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${colors.center} rounded-full shadow-xl ${colors.glow} border-2 border-accent-warning/30`} />
          </motion.div>

          {/* Petals with proper 3-phase animation - positioned radially outward */}
          {petals.map((petal) => {
            // Calculate initial position offset to prevent overlap and center properly
            const radiusOffset = 70; // Distance from center
            const angleRad = (petal.angle * Math.PI) / 180;
            const initialX = Math.sin(angleRad) * radiusOffset;
            const initialY = -Math.cos(angleRad) * radiusOffset;
            
            return (
              <motion.div
                key={petal.id}
                className="absolute z-0"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ 
                  x: '-50%',
                  y: '-50%',
                  scaleY: 0, 
                  scale: 0, 
                  opacity: 0,
                  rotate: petal.angle,
                }}
                animate={{ 
                  // Phase 1: Buds appear and move outward (0-400ms)
                  // Phase 2: Opening (400-1500ms) - expand and spin at position
                  // Phase 3: Hold visible (1500-2800ms) - stay open and visible
                  // Phase 4: Quick fade (2800-3000ms) - fade out
                  x: ['-50%', `calc(-50% + ${initialX}px)`, `calc(-50% + ${initialX}px)`, `calc(-50% + ${initialX}px)`, `calc(-50% + ${initialX}px)`],
                  y: ['-50%', `calc(-50% + ${initialY}px)`, `calc(-50% + ${initialY}px)`, `calc(-50% + ${initialY}px)`, `calc(-50% + ${initialY}px)`],
                  scaleY: [0, 0.3, 1, 1, 1],
                  scale: [0.8, 0.9, 1.3, 1.2, 1.2],
                  opacity: [0, 1, 1, 1, 0],
                  rotate: [
                    petal.angle, 
                    petal.angle + 10, 
                    petal.angle + 360, 
                    petal.angle + 360,
                    petal.angle + 360
                  ],
                }}
                transition={{
                  duration: 3.0,
                  delay: 0.08 + petal.delay,
                  times: [0, 0.13, 0.5, 0.93, 1], // 0ms, 400ms, 1500ms, 2800ms, 3000ms
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <div 
                  className={`${isCherry ? 'w-12 h-16' : 'w-14 h-20'} rounded-t-full bg-gradient-to-b ${colors.petal} shadow-xl ${colors.glow} border border-pink-300/20`}
                  style={{
                    clipPath: 'ellipse(50% 60% at 50% 40%)',
                    transformOrigin: 'center bottom',
                  }}
                />
              </motion.div>
            );
          })}

          {/* Message - Fades in during opening */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-32 text-center pointer-events-none z-20"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.6, 
              duration: 0.6,
              ease: "backOut"
            }}
          >
            <div className="bg-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-pink-200/60 backdrop-blur-sm">
              <h3 className="text-2xl font-serif text-gray-800 font-bold">
                {messages[milestone as keyof typeof messages]}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {milestone}% Complete
              </p>
            </div>
          </motion.div>

          {/* Skip hint */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 bottom-10 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg border border-gray-200/50">
              <p className="text-xs text-gray-700 font-medium">
                Click anywhere or press ESC to continue
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
