import { useState, useEffect } from "react";

export interface ScreenInfo {
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "";
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: "portrait" | "landscape" | "";
    aspectRatio: number;
    isTouchDevice: boolean;
}

export const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState<
        "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | ""
    >("");

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            // Updated breakpoints for real mobile devices
            // xs: 320px - 480px (phones in portrait: iPhone SE 375px, Galaxy S8+ 360px, iPhone X 375px, iPhone 14 Pro 393px)
            // sm: 481px - 767px (phones in landscape, phablets)
            // md: 768px - 1023px (tablets in portrait: iPad, Galaxy Tab)
            // lg: 1024px - 1279px (tablets in landscape, small laptops)
            // xl: 1280px - 1535px (laptops, desktops)
            // 2xl: 1536px+ (large desktops, 4K screens)

            if (width < 481) {
                setScreenSize("xs"); // Phones in portrait (360px-480px)
            } else if (width >= 481 && width < 768) {
                setScreenSize("sm"); // Phones in landscape, phablets
            } else if (width >= 768 && width < 1024) {
                setScreenSize("md"); // Tablets in portrait
            } else if (width >= 1024 && width < 1280) {
                setScreenSize("lg"); // Tablets in landscape, small laptops
            } else if (width >= 1280 && width < 1536) {
                setScreenSize("xl"); // Standard desktops
            } else {
                setScreenSize("2xl"); // Large desktops
            }
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    return screenSize;
};

// New hook for full screen information with detailed device detection
export const useScreenInfo = (): ScreenInfo => {
    const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
        size: "",
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        orientation: "",
        aspectRatio: 0,
        isTouchDevice: false,
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            let size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" = "xs";
            let isMobile = false;
            let isTablet = false;
            let isDesktop = false;

            // Real device breakpoints
            if (width < 481) {
                size = "xs";
                isMobile = true; // Phones: 360px-480px
            } else if (width >= 481 && width < 768) {
                size = "sm";
                isMobile = true; // Phones landscape, phablets
            } else if (width >= 768 && width < 1024) {
                size = "md";
                isTablet = true; // Tablets portrait
            } else if (width >= 1024 && width < 1280) {
                size = "lg";
                isDesktop = true; // Tablets landscape, laptops
            } else if (width >= 1280 && width < 1536) {
                size = "xl";
                isDesktop = true; // Desktops
            } else {
                size = "2xl";
                isDesktop = true; // Large desktops
            }

            const orientation = width > height ? "landscape" : "portrait";
            const aspectRatio = width / height;

            setScreenInfo({
                size,
                width,
                height,
                isMobile,
                isTablet,
                isDesktop,
                orientation,
                aspectRatio,
                isTouchDevice,
            });
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    return screenInfo;
};