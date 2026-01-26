import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, StopCircle, Target } from 'lucide-react';
import { $getRoot } from 'lexical';

const PRESET_TIMES = [5, 10, 15, 30, 60]; // minutes


interface WritingSprintPluginProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  anyPanelOpen: boolean;
}

export function WritingSprintPlugin({ isOpen, onOpen, onClose, anyPanelOpen }: WritingSprintPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(15);
  const [wordGoal, setWordGoal] = useState(500);
  const [startWordCount, setStartWordCount] = useState(0);
  const [currentWordCount, setCurrentWordCount] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          playCompletionSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft]);

  // Track word count during sprint
  useEffect(() => {
    if (!isRunning) return;

    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        setCurrentWordCount(wordCount);
      });
    });
  }, [editor, isRunning]);

  const startSprint = useCallback(() => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      setStartWordCount(wordCount);
      setCurrentWordCount(wordCount);
    });

    setTimeLeft(selectedTime * 60);
    setIsRunning(true);
    setIsPaused(false);
  }, [editor, selectedTime]);

  const pauseSprint = () => {
    setIsPaused(true);
  };

  const resumeSprint = () => {
    setIsPaused(false);
  };

  const stopSprint = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
  };

  const playCompletionSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const wordsWritten = currentWordCount - startWordCount;
  const progressPercent = Math.min((wordsWritten / wordGoal) * 100, 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen && !anyPanelOpen) {
    return (
      <button
        onClick={onOpen}
        className="absolute right-4 top-36 p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow z-20 border border-border-light"
        title="Writing Sprint"
      >
        <Timer size={20} className="text-text-secondary" />
      </button>
    );
  }
  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-36 w-80 bg-white rounded-lg shadow-2xl z-20 border border-border-light">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Timer size={18} />
          Writing Sprint
        </h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-sm"
          >
            Close
          </button>
      </div>

      <div className="p-4 space-y-4">
        {!isRunning ? (
          <>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Duration
              </label>
              <div className="flex gap-2">
                {PRESET_TIMES.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`flex-1 py-2 rounded transition-colors ${
                      selectedTime === time
                        ? 'bg-accent-focus text-white'
                        : 'bg-background-secondary text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    {time}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block flex items-center gap-1">
                <Target size={14} />
                Word Goal
              </label>
              <input
                type="number"
                value={wordGoal}
                onChange={(e) => setWordGoal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-accent-focus/30"
                min="50"
                step="50"
              />
            </div>

            <button
              onClick={startSprint}
              className="w-full py-3 bg-accent-focus text-white rounded hover:bg-accent-focus/90 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Play size={18} />
              Start Sprint
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-4xl font-bold text-text-primary mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-text-tertiary">
                {isPaused ? 'Paused' : 'Time Remaining'}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Progress</span>
                <span className="font-medium text-text-primary">
                  {wordsWritten} / {wordGoal} words
                </span>
              </div>
              <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-focus transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {progressPercent >= 100 && (
                <div className="text-xs text-green-600 font-medium mt-1 text-center">
                  🎉 Goal achieved!
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isPaused ? (
                <button
                  onClick={resumeSprint}
                  className="flex-1 py-2 bg-accent-focus text-white rounded hover:bg-accent-focus/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseSprint}
                  className="flex-1 py-2 bg-background-secondary text-text-primary rounded hover:bg-border-light transition-colors flex items-center justify-center gap-2"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              <button
                onClick={stopSprint}
                className="flex-1 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <StopCircle size={16} />
                Stop
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
