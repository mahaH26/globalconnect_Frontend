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

let counter = 0;
const nextId = () => `m${Date.now()}_${counter++}`;
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "");

function Character({ size = 64 }: { size?: number }) {
  const float = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const antenna = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      // floating up and down
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
      // blinking eyes
      Animated.loop(
        Animated.sequence([
          Animated.delay(2400),
          Animated.timing(blink, {
            toValue: 0.1,
            duration: 110,
            useNativeDriver: native,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 140,
            useNativeDriver: native,
          }),
          Animated.delay(600),
          Animated.timing(blink, {
            toValue: 0.1,
            duration: 110,
            useNativeDriver: native,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 140,
            useNativeDriver: native,
          }),
        ]),
      ),
      // pulse ring
      Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: native,
        }),
      ),
      // antenna glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(antenna, {
            toValue: 1,
            duration: 700,
            useNativeDriver: native,
          }),
          Animated.timing(antenna, {
            toValue: 0,
            duration: 700,
            useNativeDriver: native,
          }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [float, blink, pulse, antenna]);

  const faceW = size * 0.62;
  const faceH = size * 0.46;
  const eye = size * 0.1;

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
              outputRange: [0, -5],
            }),
          },
        ],
      }}
    >
      {/* pulse ring */}
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
      {/* body */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {/* antenna */}
        <View
          style={{
            position: "absolute",
            top: -size * 0.16,
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              width: size * 0.14,
              height: size * 0.14,
              borderRadius: size * 0.07,
              backgroundColor: "#FACC15",
              opacity: antenna.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }}
          />
          <View
            style={{ width: 2, height: size * 0.08, backgroundColor: "#fff" }}
          />
        </View>
        {/* face */}
        <View
          style={{
            width: faceW,
            height: faceH,
            borderRadius: faceH / 2.2,
            backgroundColor: "#fff",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: size * 0.14,
          }}
        >
          {[0, 1].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: eye,
                height: eye * 1.5,
                borderRadius: eye / 2,
                backgroundColor: colors.navy,
                transform: [{ scaleY: blink }],
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

export function AIAssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Open AI HR assistant"
        style={
          {
            position: Platform.OS === "web" ? "fixed" : "absolute",
            right: 20,
            bottom: 24,
            zIndex: 1000,
            width: 72,
            height: 72,
            alignItems: "center",
            justifyContent: "center",
          } as any
        }
      >
        <Character size={64} />
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
  const firstName = user?.full_name?.trim().split(" ")[0] || "there";

  const greeting: Msg = {
    id: "hello",
    role: "assistant",
    content: `Welcome to Global Connect, ${firstName}! I'm ${BOT_NAME}, your AI HR assistant. How can I help you today?`,
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
            backgroundColor: "#F6F7FB",
            borderRadius: wide ? 20 : 0,
            width: wide ? 640 : "100%",
            height: wide ? Math.min(760, height - 48) : "100%",
            overflow: "hidden",
          }}
        >
          {/* header */}
          <View
            style={{
              backgroundColor: colors.navy,
              paddingHorizontal: 16,
              paddingTop: wide ? 14 : 44,
              paddingBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {BOT_NAME}
              </Text>
              <Text style={{ color: "#C9CDE8", fontSize: 12 }}>
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
            contentContainerStyle={{ padding: 14, gap: 10 }}
            style={{ flex: 1 }}
            ListFooterComponent={
              sending ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#fff",
                    borderRadius: 14,
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
                    maxWidth: "85%",
                    backgroundColor: mine
                      ? colors.primary
                      : item.error
                        ? "#FDE7EC"
                        : "#fff",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: mine
                        ? "#fff"
                        : item.error
                          ? "#E11D48"
                          : colors.text,
                      fontSize: 15,
                      lineHeight: 21,
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
              borderTopWidth: 1,
              borderTopColor: "#E3E6F2",
              backgroundColor: "#fff",
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask me anything about HR..."
              placeholderTextColor="#8A90AD"
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => send(text)}
              editable={!sending}
              style={{
                flex: 1,
                backgroundColor: "#F2F4FA",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 15,
                color: colors.text,
              }}
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
