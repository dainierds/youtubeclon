import { useEffect, useState } from 'react';

export function useSpatialNavigation() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    // Initial focus setup
    const elements = Array.from(document.querySelectorAll('[data-focusable="true"]')) as HTMLElement[];
    if (elements.length > 0 && !focusedId) {
      setFocusedId(elements[0].id);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return;

      const currentElements = Array.from(document.querySelectorAll('[data-focusable="true"]')) as HTMLElement[];
      if (currentElements.length === 0) return;

      if (!focusedId) {
        setFocusedId(currentElements[0].id);
        return;
      }

      if (key === 'Enter') {
         const current = document.getElementById(focusedId);
         if (current) current.click();
         return;
      }

      e.preventDefault();
      
      const current = document.getElementById(focusedId);
      if (!current) {
        // El elemento desapareció (cambio de vista) → enfocar el primero disponible
        setFocusedId(currentElements[0]?.id || null);
        return;
      }
      
      const currRect = current.getBoundingClientRect();
      let bestMatch: HTMLElement | null = null;
      let minDistance = Infinity;

      currentElements.forEach(el => {
        if (el.id === focusedId) return;
        const rect = el.getBoundingClientRect();
        
        let isValidDirection = false;
        
        // Tolerance for slight misalignments
        const intersectY = rect.bottom > currRect.top && rect.top < currRect.bottom;
        const intersectX = rect.right > currRect.left && rect.left < currRect.right;

        if (key === 'ArrowRight' && rect.left >= currRect.right - 20 && intersectY) isValidDirection = true;
        if (key === 'ArrowLeft' && rect.right <= currRect.left + 20 && intersectY) isValidDirection = true;
        if (key === 'ArrowDown' && rect.top >= currRect.bottom - 20 && intersectX) isValidDirection = true;
        if (key === 'ArrowUp' && rect.bottom <= currRect.top + 20 && intersectX) isValidDirection = true;

        if (isValidDirection) {
          const dx = rect.left - currRect.left;
          const dy = rect.top - currRect.top;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            bestMatch = el;
          }
        }
      });

      if (bestMatch) {
         setFocusedId((bestMatch as HTMLElement).id);
         (bestMatch as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedId]);

  return { focusedId, setFocusedId };
}
