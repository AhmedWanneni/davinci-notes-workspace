import React from "react";
import { View, Modal } from "react-native";
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
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar style={tokens.isDark ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flex: 1, overflow: "hidden" }}>{children}</View>
        {bottomBar ? <View style={{ flexShrink: 0 }}>{bottomBar}</View> : null}
      </View>
    </Modal>
  );
}
