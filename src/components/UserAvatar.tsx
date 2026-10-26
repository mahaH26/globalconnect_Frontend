import { colors } from "@/theme";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

export default function UserAvatar({
  name,
  uri,
  size = 36,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        resizeMode="cover"
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FDE9F0",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#FDE9F0",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.primary,
          fontWeight: "700",
          fontSize: Math.max(11, Math.round(size * 0.36)),
        }}
      >
        {initials || "?"}
      </Text>
    </View>
  );
}
