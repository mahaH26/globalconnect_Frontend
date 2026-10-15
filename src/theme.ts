import type { ViewStyle } from "react-native";

// Palette from the Global Connect website: deep navy + magenta/pink on off-white.
// Kept your original keys so this drops straight in.

export const colors = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E3E6F0",
  text: "#1B2150",
  muted: "#6B7194",

  primary: "#E6004C",
  primaryText: "#FFFFFF",

  navy: "#232A5C", // header, hero cards
  navySoft: "#E9EBF5",
  accentSoft: "#FDE6EE",
  field: "#EDEFF7", // filled input background

  danger: "#D92D20",
  dangerSoft: "#FDECEA",
  success: "#12A150",
  successSoft: "#E3F6EC",
  warning: "#D98200",
  warningSoft: "#FFF2DB",
};

// Tighter, flatter corners — 10 for controls, 14 for cards, 20 for sheets.
export const radius = { sm: 10, md: 14, lg: 20 };

// Single soft shadow. Use nothing at all on flat surfaces (nav, rows, chips).
export const shadow: ViewStyle = {
  boxShadow: "0 2px 10px rgba(35,42,92,0.08)",
} as any;

// One weight pairing instead of a mix: semibold for headings, regular for body.
export const type = {
  heading: { fontSize: 22, fontWeight: "600", color: colors.text },
  title: { fontSize: 15, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, fontWeight: "400", color: colors.text },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted },
} as const;

// Consistent rhythm: 4 / 8 / 12 / 16 / 20 / 24.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
