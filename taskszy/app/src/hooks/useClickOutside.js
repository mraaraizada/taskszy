import { useEffect, useRef } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * @param {Function} handler - Callback function to execute when click outside is detected
 * @param {boolean} enabled - Whether the listener is enabled (default: true)
 * @returns {RefObject} - Ref to attach to the element
 * 
 * @example
 * const ref = useClickOutside(() => setIsOpen(false));
 * return <div ref={ref}>Dropdown content</div>
 */
export function useClickOutside(handler, enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      // If the click is outside the referenced element, call the handler
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    // Add event listener for mousedown (fires before click)
    // This ensures the handler runs before any onClick handlers on other elements
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also listen for touchstart for mobile devices
    document.addEventListener('touchstart', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, enabled]);

  return ref;
}
