import { useState, useRef } from 'react';

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: '★', label: 'Favorite', color: 'bg-yellow-500' },
  rightAction = { icon: '+', label: 'Add to Session', color: 'bg-primary-500' },
  threshold = 80
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only allow horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      // Apply resistance
      const resistance = 0.5;
      const resistedOffset = diffX * resistance;
      setOffsetX(Math.max(-150, Math.min(150, resistedOffset)));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (offsetX > threshold && onSwipeRight) {
      // Animate out then reset
      setOffsetX(150);
      setTimeout(() => {
        onSwipeRight();
        setOffsetX(0);
      }, 200);
    } else if (offsetX < -threshold && onSwipeLeft) {
      setOffsetX(-150);
      setTimeout(() => {
        onSwipeLeft();
        setOffsetX(0);
      }, 200);
    } else {
      setOffsetX(0);
    }

    isHorizontalSwipe.current = null;
  };

  const leftProgress = Math.max(0, offsetX / threshold);
  const rightProgress = Math.max(0, -offsetX / threshold);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left action background (swipe right) */}
      <div
        className={`absolute inset-y-0 left-0 ${rightAction.color} flex items-center justify-start px-6 text-white`}
        style={{ width: Math.abs(offsetX) + 20, opacity: leftProgress }}
      >
        <div className="flex flex-col items-center" style={{ opacity: leftProgress }}>
          <span className="text-2xl">{rightAction.icon}</span>
          <span className="text-xs mt-1">{rightAction.label}</span>
        </div>
      </div>

      {/* Right action background (swipe left) */}
      <div
        className={`absolute inset-y-0 right-0 ${leftAction.color} flex items-center justify-end px-6 text-white`}
        style={{ width: Math.abs(offsetX) + 20, opacity: rightProgress }}
      >
        <div className="flex flex-col items-center" style={{ opacity: rightProgress }}>
          <span className="text-2xl">{leftAction.icon}</span>
          <span className="text-xs mt-1">{leftAction.label}</span>
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative bg-white dark:bg-surface-dark"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
