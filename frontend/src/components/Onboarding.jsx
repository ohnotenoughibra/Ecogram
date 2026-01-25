import { useState, useEffect } from 'react';

const ONBOARDING_VERSION = '1.0';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Ecogram',
    subtitle: 'Your NoGi Training Companion',
    description: 'Build your personalized library of grappling games using the Constraints-Led Approach to develop well-rounded skills.',
    icon: (
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
          <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
          <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
          <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
        </svg>
      </div>
    )
  },
  {
    id: 'cla',
    title: 'Constraints-Led Approach',
    subtitle: 'Ecological Learning Method',
    description: 'Games use constraints (rules, space, time) to guide learning. Instead of drilling techniques in isolation, you practice problem-solving in context.',
    icon: (
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
          <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    bullets: [
      'Task constraints: Rules that shape behavior',
      'Environment: Space, equipment, partners',
      'Performer: Your skill level adapts the challenge'
    ]
  },
  {
    id: 'topics',
    title: 'Four Pillars of Grappling',
    subtitle: 'Balance Your Training',
    description: 'Every game targets one of four core areas. Balanced training develops complete grapplers.',
    icon: (
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1 .75.75 0 01-.152 1.485h-1.918l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 0118.75 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84l2.474-10.124H12.75v13.28l1.943.97a.75.75 0 11-.671 1.342L12 20.904l-2.022 1.01a.75.75 0 11-.671-1.342l1.943-.97V6.24H6.332l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 015.25 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84L4.168 6.241H2.25a.75.75 0 01-.152-1.485 49.105 49.105 0 019.152-1V3a.75.75 0 01.75-.75zm4.878 13.543l1.872-7.662 1.872 7.662h-3.744zm-9.756 0L5.25 8.131l-1.872 7.662h3.744z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    topics: [
      { color: 'bg-red-500', label: 'Offensive', desc: 'Attacks & submissions' },
      { color: 'bg-blue-500', label: 'Defensive', desc: 'Escapes & survival' },
      { color: 'bg-purple-500', label: 'Control', desc: 'Pins & pressure' },
      { color: 'bg-green-500', label: 'Transition', desc: 'Flow & movement' }
    ]
  },
  {
    id: 'games',
    title: 'Building Your Library',
    subtitle: 'Create & Organize Games',
    description: 'Add games manually, use AI to generate ideas, or import from templates. Rate games after training to track what works best.',
    icon: (
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
          <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
        </svg>
      </div>
    ),
    features: [
      { icon: '✨', label: 'AI Designer generates game ideas' },
      { icon: '📋', label: 'Organize games into sessions' },
      { icon: '⭐', label: 'Rate & favorite your best games' },
      { icon: '📊', label: 'Track progress over time' }
    ]
  },
  {
    id: 'ready',
    title: "You're Ready!",
    subtitle: 'Start Building Your Game',
    description: 'Begin by exploring sample games or creating your own. The app will suggest games to balance your training.',
    icon: (
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-blue-600 flex items-center justify-center animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const seenVersion = localStorage.getItem('onboardingVersion');
    if (seenVersion === ONBOARDING_VERSION) {
      setIsVisible(false);
      onComplete?.();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingVersion', ONBOARDING_VERSION);
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary-500 w-6'
                  : index < currentStep
                  ? 'bg-primary-300 dark:bg-primary-700'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {step.icon}

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {step.title}
          </h2>
          <p className="text-primary-600 dark:text-primary-400 font-medium mb-3">
            {step.subtitle}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {step.description}
          </p>

          {/* Bullets */}
          {step.bullets && (
            <ul className="text-left text-sm space-y-2 mb-4">
              {step.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {/* Topics grid */}
          {step.topics && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {step.topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${topic.color}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{topic.label}</p>
                    <p className="text-xs text-gray-500">{topic.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Features list */}
          {step.features && (
            <div className="space-y-2 mb-4">
              {step.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="flex-1 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors ${isLastStep ? 'flex-[2]' : ''}`}
          >
            {isLastStep ? "Let's Go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset onboarding (for testing/settings)
export function resetOnboarding() {
  localStorage.removeItem('onboardingVersion');
}
