import type { ViewStyle } from "react-native";

// Palette taken from the Global Connect website: deep navy + magenta/pink on off-white
export const colors = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  border: "#E3E6F0",
  text: "#1B2150",
  muted: "#6B7194",

  primary: "#E6004C", // pink: main buttons, active tab, spinners
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

export const radius = { sm: 10, md: 14, lg: 20 };

export const shadow: ViewStyle = {
  boxShadow: "0 2px 10px rgba(35,42,92,0.08)",
} as any;