// Next Google Fonts
import {
    Alex_Brush,
    Dancing_Script,
    Great_Vibes,
    Outfit,
    Parisienne,
} from "next/font/google";

// Create font configurations with failsafe settings
const createSafeFont = (FontComponent: any, config: any) => {
    try {
        return FontComponent({
            ...config,
            preload: false,
            display: "optional",
            fallback: config.fallback || ["cursive"],
        });
    } catch (error) {
        console.warn(`Failed to load font: ${error}`);
        // Return a fallback configuration
        return {
            className: "",
            style: { fontFamily: config.fallback?.[0] || "cursive" },
            variable: config.variable || "",
        };
    }
};

// Default Fonts
export const outfit = createSafeFont(Outfit, {
    subsets: ["latin"],
    display: "swap",
    adjustFontFallback: false,
    fallback: ["system-ui", "sans-serif"],
});

// Signature fonts
export const dancingScript = createSafeFont(Dancing_Script, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-dancing-script",
    fallback: ["cursive"],
});

export const parisienne = createSafeFont(Parisienne, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-parisienne",
    fallback: ["cursive"],
});

export const greatVibes = createSafeFont(Great_Vibes, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-great-vibes",
    fallback: ["cursive"],
});

export const alexBrush = createSafeFont(Alex_Brush, {
    subsets: ["latin"],
    weight: "400",
    variable: "--font-alex-brush",
    fallback: ["cursive"],
});
