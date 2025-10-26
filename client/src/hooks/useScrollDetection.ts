// client/src/hooks/useScrollDetection.ts
import { useEffect, useRef, useState } from 'react';

interface ScrollDetection {
    scrollRef: React.RefObject<HTMLDivElement>;
    isScrollable: boolean;
    isAtTop: boolean;
    isAtBottom: boolean;
    scrollToTop: () => void;
    scrollToBottom: () => void;
}

export const useScrollDetection = (): ScrollDetection => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrollable, setIsScrollable] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = element;

            // Check if at top
            setIsAtTop(scrollTop === 0);

            // Check if at bottom (with 10px threshold for better UX)
            setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);

            // Check if content is scrollable
            setIsScrollable(scrollHeight > clientHeight);
        };

        // Initial check
        handleScroll();

        // Listen to scroll events
        element.addEventListener('scroll', handleScroll, { passive: true });

        // Listen to resize events (when content changes)
        const resizeObserver = new ResizeObserver(() => {
            // Debounce resize handler
            requestAnimationFrame(handleScroll);
        });
        resizeObserver.observe(element);

        // Also observe children changes
        const mutationObserver = new MutationObserver(() => {
            requestAnimationFrame(handleScroll);
        });
        mutationObserver.observe(element, {
            childList: true,
            subtree: true,
        });

        return () => {
            element.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        const element = scrollRef.current;
        if (element) {
            element.scrollTo({
                top: element.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    return {
        scrollRef,
        isScrollable,
        isAtTop,
        isAtBottom,
        scrollToTop,
        scrollToBottom,
    };
};