import { useEffect, useRef } from 'react';

/**
 * Hook to detect horizontal swipe gestures on the window.
 * Distinguishes between edge swipes (Left/Right) and general swipes (Anywhere).
 * Also prevents browser-native horizontal navigation (Back/Forward).
 */
export default function useSwipeGesture({
  onSwipeRightEdge,
  onSwipeLeftEdge,
  onSwipeLeftAnywhere,
  edgeThreshold = 40,
  swipeThreshold = 80,
  angleTolerance = 0.5,
}) {
  const startX = useRef(null);
  const startY = useRef(null);
  const isMouseDown = useRef(false);
  const isGestureBlocked = useRef(false);

  useEffect(() => {
    const handleStart = (x, y, isTouch) => {
      startX.current = x;
      startY.current = y;
      isGestureBlocked.current = false;
      if (!isTouch) isMouseDown.current = true;
    };

    const handleMove = (e, currentX, currentY) => {
      if (startX.current === null || startY.current === null || isGestureBlocked.current) return;

      const diffX = currentX - startX.current;
      const diffY = currentY - startY.current;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      // We only care if the movement is primarily horizontal and started from an edge
      const isFromLeftEdge = startX.current <= edgeThreshold;
      const isFromRightEdge = startX.current >= window.innerWidth - edgeThreshold;

      if ((isFromLeftEdge || isFromRightEdge) && absDiffX > 10) {
        // If it's more horizontal than vertical, prevent browser navigation
        if (absDiffX > absDiffY * (1 / angleTolerance)) {
          if (e.cancelable) {
            e.preventDefault();
            // Once we've prevented it, we mark the gesture as active
          }
        } else {
          // If the user starts a vertical scroll, we stop tracking this gesture
          isGestureBlocked.current = true;
        }
      }
    };

    const handleEnd = (endX, endY) => {
      if (startX.current === null || startY.current === null || isGestureBlocked.current) {
         startX.current = null;
         startY.current = null;
         isMouseDown.current = false;
         return;
      }

      const diffX = endX - startX.current;
      const diffY = endY - startY.current;
      const screenWidth = window.innerWidth;

      if (Math.abs(diffX) > swipeThreshold && Math.abs(diffY) < Math.abs(diffX) * angleTolerance) {
        if (diffX > 0) {
          if (startX.current <= edgeThreshold && onSwipeRightEdge) {
            onSwipeRightEdge();
          }
        } else {
          if (startX.current >= screenWidth - edgeThreshold && onSwipeLeftEdge) {
            onSwipeLeftEdge();
          } else if (onSwipeLeftAnywhere) {
            onSwipeLeftAnywhere();
          }
        }
      }

      startX.current = null;
      startY.current = null;
      isMouseDown.current = false;
    };

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      handleStart(e.touches[0].clientX, e.touches[0].clientY, true);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      handleMove(e, e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length !== 1) return;
      handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const handleMouseDown = (e) => {
      handleStart(e.clientX, e.clientY, false);
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown.current) return;
      // Mouse move prevention is usually not needed for browser nav, 
      // but we track it for consistency if needed.
    };

    const handleMouseUp = (e) => {
      if (!isMouseDown.current) return;
      handleEnd(e.clientX, e.clientY);
    };

    // Use passive: false to allow preventDefault()
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onSwipeRightEdge, onSwipeLeftEdge, onSwipeLeftAnywhere, edgeThreshold, swipeThreshold, angleTolerance]);
}
