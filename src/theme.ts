import type { ViewStyle } from "react-native";

// Palette from the Global Connect website: deep navy + magenta/pink on off-white.
// Kept your original keys so this drops straight in.

export const colors = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E6E8F2",
  text: "#1B2150",
  muted: "#6B7194",

  primary: "#E6004C",
  primaryText: "#FFFFFF",

  navy: "#232A5C", // hero cards, strong text
  navySoft: "#EEF0F8",
  accentSoft: "#FDE9F0", // pale pink: active pills, avatars
  field: "#EDEFF7",

  danger: "#D92D20",
  dangerSoft: "#FDECEA",
  success: "#12A150",
  successSoft: "#E6F6EC",
  warning: "#D98200",
  warningSoft: "#FDF1D8",
};

// 10 for controls, 16 for cards, 20 for sheets.
export const radius = { sm: 10, md: 16, lg: 20 };

// Cards now use a hairline border instead of a heavy shadow.
// This is only a whisper of depth for the few places that still import it.
export const shadow: ViewStyle = {
  boxShadow: "0 1px 2px rgba(35,42,92,0.04)",
} as any;

// One weight pairing: bold for page headings, semibold for titles, regular for body.
export const type = {
  heading: { fontSize: 26, fontWeight: "700", color: colors.text },
  title: { fontSize: 15, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, fontWeight: "400", color: colors.text },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted },
} as const;

// Consistent rhythm: 4 / 8 / 12 / 16 / 20 / 24.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
