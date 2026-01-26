import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { SeasonalEffects } from './SeasonalEffects';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonalColors {
  leaf1: string;
  leaf2: string;
  leaf3?: string;
  trunk: string;
  background1: string;
  background2: string;
}

const SEASONAL_COLORS: Record<Season, SeasonalColors> = {
  spring: {
    leaf1: '#7CB342',    // Fresh green (Leaves Young from design.md)
    leaf2: '#9CCC65',    // Bright green (Leaves Highlight from design.md)
    leaf3: '#FFA5C0',    // Bloom pink for spring blossoms
    trunk: '#5C4A3A',    // Warm brown
    background1: '#F8F6F3', // Subtle cream
    background2: '#FEFDFB', // Warm off-white
  },
  summer: {
    leaf1: '#558B2F',    // Deep green (Leaves Mature from design.md)
    leaf2: '#7CB342',    // Fresh green
    trunk: '#3D2F24',    // Deep brown (Tree Bark Shadow from design.md)
    background1: '#E8F5E9', // Light green tint
    background2: '#F1F8E9', // Pale green
  },
  autumn: {
    leaf1: '#FF6B35',    // Orange-red
    leaf2: '#FFB74D',    // Amber (Warning from design.md)
    leaf3: '#D32F2F',    // Deep red
    trunk: '#5C4A3A',    // Warm brown
    background1: '#FFF3E0', // Pale orange
    background2: '#FEFDFB', // Warm off-white
  },
  winter: {
    leaf1: '#E0E0E0',    // No leaves - snow color
    leaf2: '#F5F5F5',    // Light snow
    trunk: '#3D2F24',    // Deep brown (bare branches)
    background1: '#ECEFF1', // Cool grey
    background2: '#FAFAFA', // Almost white
  },
};

// Simple PRNG
const random = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

interface BranchProps {
  x: number;
  y: number;
  angle: number;
  depth: number;
  maxDepth: number;
  length: number;
  width: number;
  seed: number;
  growthProgress: number; // 0 to 1 for current level
  season: Season;
  colors: SeasonalColors;
}

interface FallenPetal {
  id: string;
  x: number;
  y: number;
  rotation: number;
  isCherry: boolean;
}

const Branch: React.FC<BranchProps> = React.memo(({ x, y, angle, depth, maxDepth, length, width, seed, growthProgress, season, colors }) => {
  if (depth >= maxDepth) return null;

  // Calculate endpoint
  const endX = x + length * Math.sin(angle);
  const endY = y - length * Math.cos(angle);
  
  // Winter: no leaves, just bare branches
  const showLeaves = season !== 'winter';
  
  // Seasonal leaf color variation
  const getLeafColor = () => {
    if (season === 'autumn' && colors.leaf3) {
      // Autumn: mix of orange, amber, red
      const rand = random(seed + depth);
      if (rand < 0.33) return colors.leaf1;
      if (rand < 0.66) return colors.leaf2;
      return colors.leaf3;
    }
    if (season === 'spring' && colors.leaf3 && random(seed + depth) > 0.8) {
      // Spring: occasional blossoms
      return colors.leaf3;
    }
    // Summer/Spring: alternate between two greens
    return depth >= maxDepth - 1 ? colors.leaf1 : colors.leaf2;
  };

  // Sway animation
  // const sway = {
  //   rotate: [angle * (180 / Math.PI) - 2, angle * (180 / Math.PI) + 2, angle * (180 / Math.PI) - 2],
  //   transition: {
  //     duration: 4 + random(seed) * 2,
  //     repeat: Infinity,
  //     ease: "easeInOut",
  //     delay: random(seed),
  //   }
  // };

  // If this is the last visible branch level, animate its growth
  // const isTip = depth === maxDepth - 1;
  
  // Child branches
  const childLength = length * 0.8;
  const childWidth = width * 0.7;
  
  // Determinisic random angles
  const angleLeft = angle - (0.3 + random(seed) * 0.4);
  const angleRight = angle + (0.3 + random(seed + 1) * 0.4);

  return (
    <g>
      {/* Limb */}
      <motion.line
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ 
          duration: 0.6,
          delay: depth * 0.05,
          ease: "easeOut" 
        }}
        x1={x}
        y1={y}
        x2={endX}
        y2={endY}
        stroke={colors.trunk}
        strokeWidth={width}
        strokeLinecap="round"
      />

      {/* Leaves only on outer branches for performance */}
      {showLeaves && maxDepth >= 3 && (depth >= maxDepth - 2 && random(seed + 2) > 0.5) && (
        <motion.circle
           cx={endX}
           cy={endY}
           r={season === 'spring' && random(seed + 3) > 0.85 ? 4 + depth : 3 + depth}
           fill={getLeafColor()}
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: season === 'autumn' ? 0.9 : 0.85 }}
           transition={{ 
             delay: 0.3 + depth * 0.05, 
             duration: 0.4,
             ease: "backOut"
           }}
        />
      )}

      {/* Children */}
      {depth < maxDepth && (
        <>
          <Branch
            x={endX}
            y={endY}
            angle={angleLeft}
            depth={depth + 1}
            maxDepth={maxDepth}
            length={childLength}
            width={childWidth}
            seed={seed + 10}
            growthProgress={growthProgress}
            season={season}
            colors={colors}
          />
           <Branch
            x={endX}
            y={endY}
            angle={angleRight}
            depth={depth + 1}
            maxDepth={maxDepth}
            length={childLength}
            width={childWidth}
            seed={seed + 20}
            growthProgress={growthProgress}
            season={season}
            colors={colors}
          />
        </>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return prevProps.maxDepth === nextProps.maxDepth && 
         prevProps.depth === nextProps.depth &&
         prevProps.season === nextProps.season &&
         prevProps.growthProgress === nextProps.growthProgress;
});

export const TreePanel: React.FC = () => {
  const { project, wordCount, updateSettings, settingsConfigured } = useProjectContext();
  const [showOverflowNotice, setShowOverflowNotice] = useState(false);
  const [fallenPetals] = useState<FallenPetal[]>([]);
  const [isFullyGrown, setIsFullyGrown] = useState(false);
  const [season, setSeason] = useState<Season>((project?.treeSeason as Season) || 'spring');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(false);
  const [lastWordCount, setLastWordCount] = useState(wordCount);

  // Detect idle state (10 seconds of no typing)
  useEffect(() => {
    if (wordCount !== lastWordCount) {
      setIsIdle(false);
      setLastWordCount(wordCount);
      
      const timer = setTimeout(() => {
        setIsIdle(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [wordCount, lastWordCount]);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.2, 3)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.2, 0.5)), []);
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanX(e.clientX - panStart.x);
    setPanY(e.clientY - panStart.y);
  }, [isPanning, panStart.x, panStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const percentage = useMemo(() => 
    project ? Math.min(1, wordCount / (project.goal || 50000)) : 0,
    [project, wordCount]
  );
  
  const colors = useMemo(() => SEASONAL_COLORS[season], [season]);
  
  // Continuous seasonal cycling every 30 seconds throughout the tree's lifecycle
  useEffect(() => {
    if (!project) return;
    
    const seasonCycle: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    
    const interval = setInterval(() => {
      setSeason((currentSeason) => {
        const currentIndex = seasonCycle.indexOf(currentSeason);
        const nextIndex = (currentIndex + 1) % seasonCycle.length;
        const nextSeason = seasonCycle[nextIndex];
        
        // Update project settings with new season
        updateSettings({ treeSeason: nextSeason });
        
        return nextSeason;
      });
    }, 30000); // Change season every 30 seconds
    
    return () => clearInterval(interval);
  }, [project, updateSettings]);
  
  // Sync season with project settings only on initial load (mount only)
  useEffect(() => {
    if (project?.treeSeason) {
      setSeason(project.treeSeason as Season);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  // Check for overflow (words beyond goal)
  useEffect(() => {
    if (!project) return;
    
    const goalWords = project.goal || 50000;
    const isOverflow = wordCount > goalWords;
    
    if (isOverflow && !showOverflowNotice) {
      setShowOverflowNotice(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowOverflowNotice(false), 5000);
      return () => clearTimeout(timer);
    } else if (!isOverflow && showOverflowNotice) {
      setShowOverflowNotice(false);
    }
  }, [wordCount, project, showOverflowNotice]);

  // Track when tree is fully grown to prevent re-rendering
  useEffect(() => {
    if (wordCount > 0) {
      const goalWords = project?.goal || 50000;
      const effectivePercentage = wordCount / goalWords;
      const growthFactor = Math.log10(wordCount + 1) * 2.5;
      const linearContribution = (effectivePercentage * 8);
      const calculatedDepth = Math.floor(growthFactor + linearContribution);
      const depth = Math.min(11, Math.max(1, calculatedDepth));
      
      if (depth >= 11 && !isFullyGrown) {
        setIsFullyGrown(true);
      } else if (depth < 11 && isFullyGrown) {
        setIsFullyGrown(false);
      }
    } else if (isFullyGrown) {
      setIsFullyGrown(false);
    }
  }, [wordCount, project, isFullyGrown]);

  // Continuous word-by-word growth algorithm - must be before early returns
  // Tree grows smoothly with every word, capped at depth 11
  // Once fully grown, depth stays constant to prevent re-rendering lag
  const maxDepth = useMemo(() => {
    if (!project) return 1;
    
    const goalWords = project.goal || 50000;
    const effectivePercentage = wordCount / goalWords; // Can exceed 1.0
    
    // If tree is already fully grown, skip calculations and use locked depth
    if (isFullyGrown) return 11;
    if (wordCount === 0) return 1;
    
    // Base growth: 1 word = depth 1, grows smoothly to depth 11
    // Uses logarithmic scaling for organic feel
    const growthFactor = Math.log10(wordCount + 1) * 2.5; // Logarithmic progression
    const linearContribution = (effectivePercentage * 8); // Linear component
    
    // Combine for smooth, continuous growth
    const calculatedDepth = Math.floor(growthFactor + linearContribution);
    return Math.min(11, Math.max(1, calculatedDepth));
  }, [project, wordCount, isFullyGrown]);

  if (!project) return null;
  
  // Don't render tree until settings are configured
  if (!settingsConfigured) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background-secondary">
        <div className="text-center text-text-tertiary">
          <p className="text-lg">Configure your project settings to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full relative overflow-hidden flex items-end justify-center pb-0 transition-colors duration-700"
      style={{
        background: `linear-gradient(to bottom, ${colors.background1}, ${colors.background2})`,
        cursor: isPanning ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-text-primary" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-text-primary" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleResetView(); }}
          className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5 text-text-primary" />
        </button>
      </div>

      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        {/* Background elements (sun, clouds) could go here */}
      </div>

      <div 
        className="w-full h-full relative z-10 flex items-end justify-center"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transition: isPanning ? 'none' : 'transform 0.2s ease-out'
        }}
      >
            <motion.svg 
              viewBox="0 0 400 400" 
              className="w-full max-w-150 h-auto overflow-visible tree-svg"
              animate={isIdle ? {
                rotate: [-1.5, 1.5, -1.5],
              } : {
                rotate: 0
              }}
              transition={{
                rotate: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
                {/* Ground */}
                <line x1="-100" y1="380" x2="500" y2="380" stroke="#E0DDD8" strokeWidth="1" />
                
                {/* Fallen Petals on Ground */}
                {fallenPetals.map((petal) => (
                  <g key={petal.id}>
                    <ellipse
                      cx={petal.x}
                      cy={petal.y}
                      rx={petal.isCherry ? 3 : 4}
                      ry={petal.isCherry ? 5 : 6}
                      fill={petal.isCherry ? 'url(#cherryGradient)' : 'url(#bloomGradient)'}
                      opacity={0.6}
                      transform={`rotate(${petal.rotation} ${petal.x} ${petal.y})`}
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                      }}
                    />
                  </g>
                ))}
                
                {/* Gradients for fallen petals */}
                <defs>
                  <linearGradient id="cherryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFC0CB" />
                    <stop offset="50%" stopColor="#FFB6C1" />
                    <stop offset="100%" stopColor="#FFB0C0" />
                  </linearGradient>
                  <linearGradient id="bloomGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFA5C0" />
                    <stop offset="50%" stopColor="#FF8FB0" />
                    <stop offset="100%" stopColor="#FF6B9D" />
                  </linearGradient>
                </defs>
                
                {/* Tree Root */}
                {wordCount > 0 ? (
                    <Branch 
                        x={200} 
                        y={380} 
                        angle={0} 
                        depth={0} 
                        maxDepth={maxDepth} 
                        length={60} 
                        width={12} 
                        seed={12345}
                        growthProgress={1}
                        season={season}
                        colors={colors}
                    />
                ) : (
                    // Seed State
                     <motion.circle 
                        cx={200} 
                        cy={380} 
                        r={6} 
                        fill="#5C4A3A" 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                     />
                )}
            </motion.svg>
      </div>

      {/* Seasonal particle effects - positioned outside pan/zoom transform, above tree */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        <SeasonalEffects season={season} isFullyGrown={isFullyGrown} />
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 items-end">
        {/* Growth percentage */}
        <div className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm">
          <span className="text-xs font-mono text-text-tertiary">Growth: {Math.floor(percentage * 100)}%</span>
        </div>
        {/* Season indicator */}
        <div className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
          <span className="text-sm">
            {season === 'spring' && '🌸'}
            {season === 'summer' && '☀️'}
            {season === 'autumn' && '🍂'}
            {season === 'winter' && '❄️'}
          </span>
          <span className="text-xs font-medium text-text-secondary capitalize">
            {season}
          </span>
        </div>
      </div>

      {/* Overflow Notification */}
      <AnimatePresence>
        {showOverflowNotice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-accent-success text-white px-6 py-3 rounded-full shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Goal exceeded! Your tree keeps growing.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
