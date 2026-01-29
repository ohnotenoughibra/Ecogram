import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const TOUR_VERSION = '1.0';
const TOUR_STORAGE_KEY = 'featureTourCompleted';

// Tour steps configuration
const tourSteps = [
  {
    id: 'new-game',
    target: '[data-tour="new-game"]',
    title: 'Create Your First Game',
    content: 'Click here to add a new training game to your library. Define objectives, constraints, and coaching notes.',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'ai-designer',
    target: '[data-tour="ai-designer"]',
    fallbackTarget: 'a[href="/ai"]',
    title: 'AI Game Designer',
    content: 'Let AI generate game ideas based on positions, techniques, or training goals.',
    position: 'bottom',
  },
  {
    id: 'filters',
    target: '[data-tour="filters"]',
    title: 'Filter & Search',
    content: 'Quickly find games by topic, position, or keyword. Use presets for common scenarios.',
    position: 'bottom',
  },
  {
    id: 'smart-hub',
    target: '[data-tour="smart-hub"]',
    title: 'Training Coach',
    content: 'Get personalized recommendations, track your streak, and complete daily challenges.',
    position: 'bottom',
  },
  {
    id: 'game-card',
    target: '[data-tour="game-card"]',
    title: 'Game Cards',
    content: 'Click to expand details. Swipe to favorite. Use the star to mark favorites for quick access.',
    position: 'top',
  },
];

// Tooltip component that positions itself relative to target
function TourTooltip({ step, targetRect, onNext, onPrev, onSkip, currentIndex, totalSteps }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;
    const arrowSize = 8;

    let top, left;

    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - arrowSize - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + arrowSize + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - arrowSize - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + arrowSize + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left;
    }

    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    setPosition({ top, left });
  }, [targetRect, step.position]);

  const arrowClasses = {
    top: 'bottom-[-8px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-gray-800',
    bottom: 'top-[-8px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-gray-800',
    left: 'right-[-8px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white dark:border-l-gray-800',
    right: 'left-[-8px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white dark:border-r-gray-800',
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10001] w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in"
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-8 ${arrowClasses[step.position] || arrowClasses.bottom}`}
      />

      <div className="p-4">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
            Step {currentIndex + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {step.content}
        </p>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            {currentIndex === totalSteps - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentIndex
                ? 'bg-primary-500'
                : i < currentIndex
                ? 'bg-primary-300 dark:bg-primary-700'
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Spotlight overlay that highlights the target element
function Spotlight({ targetRect }) {
  if (!targetRect) return null;

  const padding = 8;
  const borderRadius = 12;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        className="absolute border-2 border-primary-500 rounded-xl animate-pulse pointer-events-none"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
      />
    </div>
  );
}

export default function FeatureTour({ onComplete, autoStart = false }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [visibleSteps, setVisibleSteps] = useState([]);

  // Filter to only steps with visible targets
  useEffect(() => {
    const checkVisibility = () => {
      const visible = tourSteps.filter(step => {
        const el = document.querySelector(step.target) ||
                   (step.fallbackTarget && document.querySelector(step.fallbackTarget));
        return el && el.offsetParent !== null;
      });
      setVisibleSteps(visible);
    };

    checkVisibility();
    // Recheck when content might have loaded
    const timer = setTimeout(checkVisibility, 500);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Check if tour should auto-start
  useEffect(() => {
    if (autoStart) {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (completed !== TOUR_VERSION) {
        // Delay to let UI render
        const timer = setTimeout(() => setIsActive(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart]);

  // Update target rect when step changes
  useEffect(() => {
    if (!isActive || visibleSteps.length === 0) {
      setTargetRect(null);
      return;
    }

    const step = visibleSteps[currentStepIndex];
    if (!step) return;

    const updateRect = () => {
      const el = document.querySelector(step.target) ||
                 (step.fallbackTarget && document.querySelector(step.fallbackTarget));
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, currentStepIndex, visibleSteps]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, visibleSteps.length]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, TOUR_VERSION);
    setIsActive(false);
    setCurrentStepIndex(0);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handlePrev, handleSkip]);

  if (!isActive || visibleSteps.length === 0) return null;

  const currentStep = visibleSteps[currentStepIndex];

  return createPortal(
    <>
      {/* Click blocker */}
      <div
        className="fixed inset-0 z-[9999]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight overlay */}
      <Spotlight targetRect={targetRect} />

      {/* Tooltip */}
      {targetRect && (
        <TourTooltip
          step={currentStep}
          targetRect={targetRect}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          currentIndex={currentStepIndex}
          totalSteps={visibleSteps.length}
        />
      )}
    </>,
    document.body
  );
}

// Hook to start the tour programmatically
export function useFeatureTour() {
  const [tourActive, setTourActive] = useState(false);

  const startTour = useCallback(() => {
    setTourActive(true);
  }, []);

  const TourComponent = useCallback(
    ({ onComplete }) =>
      tourActive ? (
        <FeatureTour
          onComplete={() => {
            setTourActive(false);
            onComplete?.();
          }}
          autoStart={false}
        />
      ) : null,
    [tourActive]
  );

  return { startTour, TourComponent, tourActive };
}

// Reset tour (for testing/settings)
export function resetFeatureTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
