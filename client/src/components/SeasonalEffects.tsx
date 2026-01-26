import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonalEffectsProps {
  season: Season;
  isFullyGrown: boolean;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

export const SeasonalEffects: React.FC<SeasonalEffectsProps> = ({ season, isFullyGrown }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Show effects for all seasons at any growth stage
    // Generate particles based on season
    let particleCount: number;
    switch (season) {
      case 'spring':
        particleCount = 20; // Cherry blossom petals
        break;
      case 'summer':
        particleCount = 8; // Fireflies/butterflies
        break;
      case 'autumn':
        particleCount = 15; // Falling leaves
        break;
      case 'winter':
        particleCount = 40; // Snowflakes
        break;
      default:
        particleCount = 0;
    }

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Percentage across screen
      delay: Math.random() * 20, // Very long stagger (0-20s) for continuous random appearance
      duration: season === 'winter' 
        ? 15 + Math.random() * 10 // Very slow snow (15-25s)
        : season === 'summer'
        ? 8 + Math.random() * 6 // Slow butterflies (8-14s)
        : 12 + Math.random() * 8, // Very slow for spring/autumn (12-20s)
      rotation: Math.random() * 360,
      size: season === 'winter' 
        ? 16 + Math.random() * 16 // Large snowflakes (16-32px)
        : season === 'summer'
        ? 20 + Math.random() * 12 // Large butterflies (20-32px)
        : 16 + Math.random() * 12, // Large petals/leaves (16-28px)
    }));

    setParticles(newParticles);
  }, [season]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={season}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
          className="absolute will-change-transform"
          style={{
            left: `${particle.x}%`,
            top: season === 'summer' ? `${Math.random() * 80}%` : '-20px', // Butterflies start at random heights, others above viewport
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={
            season === 'summer'
              ? {
                  // Butterflies float around
                  y: [0, -30, -60, -30, 0],
                  x: [0, 40, -20, 30, 0],
                  opacity: [0, 1, 1, 1, 1],
                  rotate: [0, 15, -15, 10, 0],
                }
              : {
                  // Falling particles from top to bottom
                  y: ['0vh', '100vh'],
                  opacity: [0, 0.9, 0.9, 0.9, 0.9],
                  x: season === 'winter' 
                    ? [0, Math.sin(particle.id) * 60, Math.cos(particle.id) * 60, Math.sin(particle.id + 1) * 40] // Snow drifts side to side
                    : season === 'spring'
                    ? [0, Math.sin(particle.id) * 50, -Math.cos(particle.id) * 40, Math.sin(particle.id + 2) * 30] // Cherry blossoms sway more
                    : [0, Math.sin(particle.id) * 30, 0], // Autumn leaves gentle sway
                  rotate: [particle.rotation, particle.rotation + 360 * 2],
                }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: season === 'summer' ? 'easeInOut' : 'linear',
            opacity: {
              times: [0, 0.1, 0.9, 1],
            },
          }}
        >
          {season === 'spring' ? (
            // Spring cherry blossom petals
            <svg width={particle.size} height={particle.size} viewBox="0 0 20 20">
              <ellipse 
                cx="10" 
                cy="10" 
                rx="4" 
                ry="6" 
                fill="#FFA5C0" 
                opacity={0.95}
                transform={`rotate(${particle.rotation} 10 10)`}
              />
            </svg>
          ) : season === 'summer' ? (
            // Summer butterflies
            <svg width={particle.size} height={particle.size} viewBox="0 0 24 24">
              <path
                d="M12 4c-1.5 0-2.5 1-2.5 2.5 0 0.5 0.2 1 0.5 1.4-2 0.5-3.5 2.3-3.5 4.4 0 2.5 2 4.5 4.5 4.5 0.8 0 1.6-0.2 2.2-0.6 0.6 0.4 1.4 0.6 2.2 0.6 2.5 0 4.5-2 4.5-4.5 0-2.1-1.5-3.9-3.5-4.4 0.3-0.4 0.5-0.9 0.5-1.4C16.5 5 15.5 4 14 4c-0.8 0-1.5 0.4-1.9 1C11.6 4.4 11 4 10.1 4z"
                fill="#FFD54F"
                opacity={0.7}
              />
              <circle cx="9" cy="10" r="1" fill="#333" />
              <circle cx="15" cy="10" r="1" fill="#333" />
            </svg>
          ) : season === 'autumn' ? (
            // Autumn leaves
            <svg width={particle.size} height={particle.size} viewBox="0 0 20 20">
              <path
                d="M10 2 C12 4, 16 6, 18 10 C16 14, 12 16, 10 18 C8 16, 4 14, 2 10 C4 6, 8 4, 10 2 Z"
                fill={
                  particle.id % 3 === 0
                    ? '#FF6B35' // Orange-red
                    : particle.id % 3 === 1
                    ? '#FFB74D' // Amber
                    : '#D32F2F' // Deep red
                }
                opacity={0.8}
              />
            </svg>
          ) : (
            // Winter snowflakes
            <svg width={particle.size} height={particle.size} viewBox="0 0 20 20">
              <g opacity={0.9}>
                <circle cx="10" cy="10" r="2" fill="#E0E0E0" />
                <line x1="10" y1="3" x2="10" y2="17" stroke="#E0E0E0" strokeWidth="1" />
                <line x1="3" y1="10" x2="17" y2="10" stroke="#E0E0E0" strokeWidth="1" />
                <line x1="5" y1="5" x2="15" y2="15" stroke="#E0E0E0" strokeWidth="1" />
                <line x1="5" y1="15" x2="15" y2="5" stroke="#E0E0E0" strokeWidth="1" />
                {/* Additional arms for more detailed snowflakes */}
                <line x1="10" y1="3" x2="8" y2="5" stroke="#E0E0E0" strokeWidth="0.5" />
                <line x1="10" y1="3" x2="12" y2="5" stroke="#E0E0E0" strokeWidth="0.5" />
                <line x1="10" y1="17" x2="8" y2="15" stroke="#E0E0E0" strokeWidth="0.5" />
                <line x1="10" y1="17" x2="12" y2="15" stroke="#E0E0E0" strokeWidth="0.5" />
              </g>
            </svg>
          )}
        </motion.div>
      ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
