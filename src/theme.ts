import type { ViewStyle } from "react-native";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

const KEY = "gc_theme";

export const lightColors = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E6E8F2",
  text: "#1B2150",
  muted: "#6B7194",
  soft: "#5B6385",
  hover: "#F4F5FA",
  heading: "#232A5C",

  primary: "#E6004C",
  primaryText: "#FFFFFF",
  primaryHover: "#CC0043",

  // surface colour (e.g. Team attendance card background)
  navy: "#232A5C",
  navySoft: "#EEF0F8",
  accentSoft: "#FDE9F0",
  field: "#EDEFF7",

  // text colour for things that used navy as text
  navyText: "#232A5C",

  // inputs, chips, secondary buttons
  inputBg: "#FFFFFF",
  hoverBorder: "#D3D7EA",
  placeholder: "#9AA0C0",

  danger: "#D92D20",
  dangerSoft: "#FDECEA",
  dangerHover: "#FADBD7",
  success: "#12A150",
  successSoft: "#E6F6EC",
  warning: "#D98200",
  warningSoft: "#FDF1D8",
  warningText: "#B7791F",
};

export const darkColors: typeof lightColors = {
  bg: "#0B0E20",
  card: "#151934",
  border: "#2A2F55",
  text: "#EEF0FB",
  muted: "#A0A7D2",
  soft: "#B4BAE0",
  hover: "#1E2349",
  heading: "#F5F6FF",

  primary: "#FF4D82",
  primaryText: "#FFFFFF",
  primaryHover: "#E63D72",

  navy: "#26306B",
  navySoft: "#1E2348",
  accentSoft: "#3A1A31",
  field: "#1E2348",

  navyText: "#EEF0FB",

  inputBg: "#1E2348",
  hoverBorder: "#3A4070",
  placeholder: "#7F87B5",

  danger: "#FF7A6E",
  dangerSoft: "#3D1C1A",
  dangerHover: "#4D2321",
  success: "#3DD283",
  successSoft: "#12301F",
  warning: "#F5B04A",
  warningSoft: "#3A2C0F",
  warningText: "#F5B04A",
};

function readSaved(): ThemeMode {
  try {
    if (Platform.OS === "web") {
      const v = (globalThis as any).localStorage?.getItem(KEY);
      return v === "dark" ? "dark" : "light";
    }
    const SecureStore = require("expo-secure-store");
    const v = SecureStore.getItem?.(KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveMode(mode: ThemeMode) {
  try {
    if (Platform.OS === "web") {
      (globalThis as any).localStorage?.setItem(KEY, mode);
      return;
    }
    const SecureStore = require("expo-secure-store");
    SecureStore.setItem?.(KEY, mode);
  } catch {}
}

let current: ThemeMode = readSaved();
let version = 0;

export const colors = {
  ...(current === "dark" ? darkColors : lightColors),
} as typeof lightColors;

export const getMode = () => current;
export const themeVersion = () => version;

export function applyTheme(mode: ThemeMode) {
  current = mode;
  Object.assign(colors, mode === "dark" ? darkColors : lightColors);
  version += 1;
}

// compatibility aliases for older imports
export const applyPalette = applyTheme;
export type Mode = ThemeMode;

export const radius = { sm: 10, md: 16, lg: 20 };

export const shadow: ViewStyle = {
  boxShadow: "0 1px 2px rgba(35,42,92,0.04)",
} as any;

export const type = {
  get heading() {
    return { fontSize: 26, fontWeight: "700" as const, color: colors.text };
  },
  get title() {
    return { fontSize: 15, fontWeight: "600" as const, color: colors.text };
  },
  get body() {
    return { fontSize: 14, fontWeight: "400" as const, color: colors.text };
  },
  get label() {
    return { fontSize: 12, fontWeight: "600" as const, color: colors.muted };
  },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
