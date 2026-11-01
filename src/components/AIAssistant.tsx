import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const BOT_NAME = "Noor";
const native = Platform.OS !== "web";

// HR logo. File lives at <project root>/assets/logo/Hr.jpg
// (this file is src/components/AIAssistant.tsx, so go up two levels).
const LOGO = require("../../assets/logo/Hr.jpg");

const FONT = Platform.select({
  ios: "System",
  android: "sans-serif",
  default:
    "Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, system-ui, sans-serif",
});

let counter = 0;
const nextId = () => `m${Date.now()}_${counter++}`;
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "");

/* Logo with a gentle float + pulse ring */
function Logo({
  size = 64,
  animated = true,
}: {
  size?: number;
  animated?: boolean;
}) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: native,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: native,
          }),
        ]),
      ),
      Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: native,
        }),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [float, pulse, animated]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        transform: [
          {
            translateY: float.interpolate({
              inputRange: [0, 1],
              outputRange: [0, animated ? -5 : 0],
            }),
          },
        ],
      }}
    >
      {animated ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 0],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.7],
                }),
              },
            ],
          }}
        />
      ) : null}

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#fff",
          overflow: "hidden",
          borderWidth: 2,
          borderColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Image
          source={LOGO}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityLabel="HR assistant logo"
        />
      </View>
    </Animated.View>
  );
}

export function AIAssistantFab() {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();

  // responsive button: 56 on small phones, up to 72 on large screens
  const logoSize = width < 380 ? 52 : width < 700 ? 58 : 68;
  const box = logoSize + 8;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Open AI HR assistant"
        style={
          {
            position: Platform.OS === "web" ? "fixed" : "absolute",
            right: width < 700 ? 14 : 20,
            bottom: width < 700 ? 18 : 24,
            zIndex: 1000,
            width: box,
            height: box,
            alignItems: "center",
            justifyContent: "center",
          } as any
        }
      >
        <Logo size={logoSize} />
      </Pressable>
      <ChatModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ChatModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const wide = width >= 700;
  const small = width < 380;
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";

  // Three separate lines, as requested
  const greeting: Msg = {
    id: "hello",
    role: "assistant",
    content: `Hi ${firstName}, welcome!\nI'm ${BOT_NAME}, your AI HR assistant.\nHow can I help you today?`,
  };

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  const data = [greeting, ...messages];

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [messages, sending, visible]);

  async function send(raw: string) {
    const content = raw.trim();
    if (!content || sending) return;

    const history = messages
      .filter((m) => !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((p) => [...p, { id: nextId(), role: "user", content }]);
    setText("");
    setSending(true);
    try {
      const res = await api<{ reply: string }>("/assistant/chat", {
        method: "POST",
        body: { message: content, history },
      });
      setMessages((p) => [
        ...p,
        { id: nextId(), role: "assistant", content: clean(res.reply || "...") },
      ]);
    } catch (e: any) {
      setMessages((p) => [
        ...p,
        {
          id: nextId(),
          role: "assistant",
          error: true,
          content: e?.message ?? "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,14,40,0.55)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: colors.bg,
            borderRadius: wide ? 20 : 0,
            width: wide ? Math.min(640, width - 48) : "100%",
            height: wide ? Math.min(760, height - 48) : "100%",
            overflow: "hidden",
          }}
        >
          {/* header */}
          <View
            style={{
              backgroundColor: colors.navy,
              paddingHorizontal: small ? 12 : 16,
              paddingTop: wide ? 14 : 44,
              paddingBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Logo size={small ? 38 : 44} animated={false} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: small ? 16 : 18,
                  fontWeight: "700",
                  fontFamily: FONT,
                  letterSpacing: 0.3,
                }}
              >
                {BOT_NAME}
              </Text>
              <Text
                style={{
                  color: "#C9CDE8",
                  fontSize: 12,
                  fontFamily: FONT,
                  letterSpacing: 0.2,
                }}
              >
                AI HR Assistant
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>

          {/* messages */}
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: small ? 10 : 14, gap: 10 }}
            style={{ flex: 1 }}
            ListFooterComponent={
              sending ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const mine = item.role === "user";
              return (
                <View
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: wide ? "80%" : "88%",
                    backgroundColor: mine
                      ? colors.primary
                      : item.error
                        ? colors.dangerSoft
                        : colors.card,
                    borderWidth: mine ? 0 : 1,
                    borderColor: item.error ? colors.danger : colors.border,
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: mine
                        ? "#fff"
                        : item.error
                          ? colors.danger
                          : colors.text,
                      fontSize: small ? 14 : 15,
                      lineHeight: small ? 20 : 22,
                      fontFamily: FONT,
                      letterSpacing: 0.15,
                    }}
                  >
                    {item.content}
                  </Text>
                </View>
              );
            }}
          />

          {/* input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              paddingBottom: Platform.OS === "ios" && !wide ? 24 : 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask me anything about HR..."
              placeholderTextColor={colors.placeholder}
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => send(text)}
              editable={!sending}
              style={
                {
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  fontFamily: FONT,
                  color: colors.text,
                  ...(Platform.OS === "web" ? { outlineStyle: "none" } : null),
                } as any
              }
            />
            <Pressable
              onPress={() => send(text)}
              disabled={sending || !text.trim()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: sending || !text.trim() ? 0.5 : 1,
              }}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
