// Next Google Fonts - conditional loading for Docker builds
import {
    Alex_Brush,
    Dancing_Script,
    Great_Vibes,
    Outfit,
    Parisienne,
} from "next/font/google";

// Create a safe font wrapper that handles network failures
const createFont = (fontLoader: any, config: any) => {
    // During Docker builds, skip font loading to prevent network timeouts
    if (process.env.SKIP_FONT_DOWNLOAD === 'true') {
        return {
            className: '',
            style: { fontFamily: config.fallback?.[0] || 'sans-serif' },
            variable: config.variable || '',
        };
    }
    
    return fontLoader({
        ...config,
        preload: false,
        display: "optional",
        fallback: config.fallback || ["sans-serif"],
    });
};

// Default Fonts
export const outfit = createFont(Outfit, {
    subsets: ["latin"],
    display: "swap",
    adjustFontFallback: false,
    fallback: ["system-ui", "sans-serif"],
});

// Signature fonts
export const dancingScript = createFont(Dancing_Script, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-dancing-script",
    fallback: ["cursive"],
});

export const parisienne = createFont(Parisienne, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-parisienne",
    fallback: ["cursive"],
});

export const greatVibes = createFont(Great_Vibes, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-great-vibes",
    fallback: ["cursive"],
});

export const alexBrush = createFont(Alex_Brush, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-alex-brush",
    fallback: ["cursive"],
});
