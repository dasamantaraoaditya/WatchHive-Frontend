import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls the window to the top (0, 0) whenever the route changes.
 * This ensures that navigating to a new page doesn't inherit the scroll position of the previous page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the very top of the window
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll is preferred for page transitions to avoid flicker
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
