import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";

export interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
}

export function NavigationDrawer({
  visible,
  onClose,
  children,
  bottomBar,
}: NavigationDrawerProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const drawerWidth = width;
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, drawerWidth, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar style={tokens.isDark ? "light" : "dark"} />
      <View style={{ flex: 1, width: "100%", height: "100%" }}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.color.bg.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close navigation drawer"
        />

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: drawerWidth,
            height: "100%",
            backgroundColor: tokens.color.bg.primary,
            borderRightWidth: 1,
            borderRightColor: tokens.color.border.subtle,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: slideAnim }],
            zIndex: 10,
          }}
        >
          <View style={{ flex: 1, overflow: "hidden" }}>{children}</View>
          {bottomBar ? (
            <View style={{ flexShrink: 0 }}>{bottomBar}</View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
