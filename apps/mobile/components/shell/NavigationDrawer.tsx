import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Pressable,
  Animated,
  useWindowDimensions,
} from "react-native";
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

  const drawerWidth = Math.min(width * 0.82, 340);
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
      <View className="flex-1 flex-row">
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: tokens.color.bg.scrim }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close navigation drawer"
        />

        <Animated.View
          style={{
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
          <View className="flex-1 overflow-hidden">{children}</View>
          {bottomBar ? (
            <View className="flex-shrink-0">{bottomBar}</View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
