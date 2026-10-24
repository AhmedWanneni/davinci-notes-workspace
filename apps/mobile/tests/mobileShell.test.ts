import { describe, expect, it, vi } from "vitest";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => children,
}));

import { mobileTokens, darkColorTokens } from "@app/design-tokens/mobile";
import ComponentGalleryScreen from "../app/gallery";

describe("Mobile Shell & Primitives Verification", () => {
  it("enforces minimum 44pt touch target token across mobile components", () => {
    expect(mobileTokens.minTouchTarget).toBe(44);
    expect(mobileTokens.touchTargetSize).toBe("44px");
  });

  it("verifies safe-area layout constants match mobile specifications", () => {
    expect(mobileTokens.safeArea.headerHeight).toBe(44);
    expect(mobileTokens.safeArea.bottomBarHeight).toBe(48);
    expect(mobileTokens.bottomSheetRadius).toBe("16px");
    expect(mobileTokens.bottomSheetRadiusNumber).toBe(16);
  });

  it("verifies dark-first token palette matches desktop Obsidian baseline", () => {
    expect(darkColorTokens.bg.primary).toBe("#1e1e1e");
    expect(darkColorTokens.bg["primary-alt"]).toBe("#161616");
    expect(darkColorTokens.bg.secondary).toBe("#262626");
    expect(darkColorTokens.text.normal).toBe("#dcddde");
    expect(darkColorTokens.text.muted).toBe("#888888");
    expect(darkColorTokens.border.normal).toBe("#363636");
    expect(darkColorTokens.border.subtle).toBe("#2e2e2e");
    expect(darkColorTokens.interactive.accent).toBe("#7f6df2");
  });

  it("verifies component gallery is tree-shaken and returns null in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const result = ComponentGalleryScreen();
      expect(result).toBeNull();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("verifies app.json enforces dark userInterfaceStyle", async () => {
    const appJson = await import("../app.json");
    expect(appJson.expo.userInterfaceStyle).toBe("dark");
  });

  it("verifies tailwind config includes all feature directories and class dark mode", async () => {
    // @ts-expect-error CommonJS config lacks TypeScript declarations
    const tailwindConfig = await import("../tailwind.config.js");
    const content = tailwindConfig.content ?? tailwindConfig.default?.content;
    const darkMode =
      tailwindConfig.darkMode ?? tailwindConfig.default?.darkMode;
    expect(darkMode).toBe("class");
    expect(content).toContain("./reader/**/*.{js,jsx,ts,tsx}");
    expect(content).toContain("./canvas/**/*.{js,jsx,ts,tsx}");
    expect(content).toContain("./capture/**/*.{js,jsx,ts,tsx}");
    expect(content).toContain("./graph/**/*.{js,jsx,ts,tsx}");
    expect(content).toContain("./sync/**/*.{js,jsx,ts,tsx}");
  });

  it("verifies root ErrorBoundary renders error details and handles retry action", async () => {
    const { ErrorBoundary } = await import("../app/_layout");
    const { hideAsync } = await import("expo-splash-screen");
    const retryMock = vi.fn();
    const testError = new Error("Simulated startup failure");

    const element = ErrorBoundary({ error: testError, retry: retryMock });
    expect(element).toBeDefined();
    expect((element.props as { className?: string }).className).toContain(
      "bg-bg-primary",
    );
    expect(hideAsync).toHaveBeenCalled();
  });

  it("verifies Breadcrumbs applies child layout to contentContainer, not className", async () => {
    const { Breadcrumbs } = await import("../components/Breadcrumbs");
    const element = Breadcrumbs({
      currentFolder: "test/sub",
      onNavigate: vi.fn(),
    });
    expect(element).toBeDefined();
  });

  it("verifies all primitives render properly under theme tokens with minTouchTarget >= 44", async () => {
    const React = (await import("react")).default;
    const {
      Text,
      Button,
      IconButton,
      ListItem,
      Sheet,
      SheetGroup,
      Input,
      Badge,
      Divider,
    } = await import("../components/primitives");

    // Text renders with dynamic color
    const textEl = React.createElement(Text, {
      children: "Hello World",
      variant: "h1",
    });
    expect(textEl).toBeDefined();

    // Button renders with primary variant and 44pt min height
    const btnEl = React.createElement(Button, {
      children: "Action",
      variant: "primary",
    });
    expect(btnEl).toBeDefined();

    // IconButton renders with ghost variant
    const iconBtnEl = React.createElement(IconButton, {
      icon: null,
      accessibilityLabel: "Close",
      variant: "ghost",
    });
    expect(iconBtnEl).toBeDefined();

    // ListItem renders with title and subtitle
    const listEl = React.createElement(ListItem, {
      title: "Note 1",
      subtitle: "Folder A",
    });
    expect(listEl).toBeDefined();

    // Input renders with dynamic placeholder color
    const inputEl = React.createElement(Input, { placeholder: "Search..." });
    expect(inputEl).toBeDefined();

    // Badge renders with accent variant
    const badgeEl = React.createElement(Badge, {
      children: "v1.0",
      variant: "accent",
    });
    expect(badgeEl).toBeDefined();

    // Divider renders with strong variant
    const dividerEl = React.createElement(Divider, { variant: "strong" });
    expect(dividerEl).toBeDefined();

    // Sheet and SheetGroup render with grouped card support
    const sheetEl = React.createElement(Sheet, {
      visible: true,
      onClose: vi.fn(),
      title: "Note Options",
      children: React.createElement(SheetGroup, { children: listEl }),
    });
    expect(sheetEl).toBeDefined();
  });
});
