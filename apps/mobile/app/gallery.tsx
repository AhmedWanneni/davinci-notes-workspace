import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  FileText,
  MagnifyingGlass,
  Sparkle,
} from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import {
  Badge,
  Button,
  Divider,
  IconButton,
  Input,
  ListItem,
  Sheet,
  Text,
} from "../components/primitives";
import { ScreenLayout } from "../components/layout";

export default function ComponentGalleryScreen(): React.ReactElement | null {
  // Tree-shaking guard for production builds
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <ScreenLayout
      title="Component Gallery"
      headerLeft={
        <IconButton
          icon={
            <ArrowLeft
              size={20}
              color={darkColorTokens.text.normal}
              weight="regular"
            />
          }
          accessibilityLabel="Go back"
          size="sm"
          onPress={() => router.back()}
        />
      }
    >
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* 1. Typography / Text */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          1. TEXT & TYPOGRAPHY
        </Text>
        <View className="p-3 bg-bg-secondary rounded-md border border-border-normal mb-6">
          <Text variant="h1">Heading 1 (24pt Bold)</Text>
          <Text variant="h2" className="mt-1">
            Heading 2 (20pt Semibold)
          </Text>
          <Text variant="h3" className="mt-1">
            Heading 3 (18pt Semibold)
          </Text>
          <Text variant="body" color="normal" className="mt-2">
            Body normal text in Swiss/editorial typographic hierarchy.
          </Text>
          <Text variant="caption" color="muted" className="mt-1">
            Caption muted text for secondary metadata.
          </Text>
          <Text variant="editor" color="accent" className="mt-1">
            editor.mono.code();
          </Text>
        </View>

        {/* 2. Buttons */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          2. BUTTONS (MIN 44PT TOUCH TARGET)
        </Text>
        <View className="gap-2 mb-6">
          <Button
            variant="primary"
            icon={
              <Sparkle size={18} color={darkColorTokens.text["on-accent"]} />
            }
          >
            Primary Action
          </Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="ghost">Ghost Action</Button>
          <Button variant="danger">Danger Destructive</Button>
          <View className="flex-row gap-2 items-center mt-2">
            <Button size="sm" variant="secondary">
              Small
            </Button>
            <Button size="md" variant="secondary">
              Medium
            </Button>
            <Button size="lg" variant="primary">
              Large
            </Button>
          </View>
        </View>

        {/* 3. Icon Buttons */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          3. ICON BUTTONS (PHOSPHOR REGULAR)
        </Text>
        <View className="flex-row gap-3 mb-6 items-center">
          <IconButton
            icon={<FileText size={20} color={darkColorTokens.text.normal} />}
            accessibilityLabel="File"
            variant="ghost"
          />
          <IconButton
            icon={
              <MagnifyingGlass size={20} color={darkColorTokens.text.normal} />
            }
            accessibilityLabel="Search"
            variant="secondary"
          />
          <IconButton
            icon={<Check size={20} color={darkColorTokens.text["on-accent"]} />}
            accessibilityLabel="Check"
            variant="primary"
          />
        </View>

        {/* 4. Badges */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          4. BADGES (NO PILL BADGES)
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          <Badge variant="neutral">neutral</Badge>
          <Badge variant="accent">accent</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="error">error</Badge>
        </View>

        {/* 5. Inputs */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          5. INPUTS
        </Text>
        <View className="gap-3 mb-6">
          <Input
            placeholder="Search notes..."
            value={inputValue}
            onChangeText={setInputValue}
            prefix={
              <MagnifyingGlass size={18} color={darkColorTokens.text.muted} />
            }
          />
          <Input
            placeholder="Error validation state"
            variant="error"
            value="invalid-entry"
          />
        </View>

        {/* 6. Dividers */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          6. DIVIDERS (NORMAL & STRONG)
        </Text>
        <View className="gap-3 mb-6">
          <Divider variant="normal" />
          <Divider variant="strong" />
        </View>

        {/* 7. List Items */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          7. LIST ITEMS (BORDER DEPTH)
        </Text>
        <View className="border border-border-normal rounded-md overflow-hidden mb-6">
          <ListItem
            title="Standard List Item"
            subtitle="Subtitle secondary description"
            left={<FileText size={20} color={darkColorTokens.text.accent} />}
            right={<Badge variant="neutral">New</Badge>}
          />
          <ListItem
            title="Selected State Item"
            subtitle="Highlighted active background"
            selected
            right={<Check size={18} color={darkColorTokens.text.accent} />}
          />
        </View>

        {/* 8. Bottom Sheet */}
        <Text
          variant="caption"
          weight="semibold"
          color="accent"
          className="mb-2"
        >
          8. SHEET (MODAL BOTTOM SHEET)
        </Text>
        <Button
          variant="secondary"
          onPress={() => setSheetOpen(true)}
          className="mb-12"
        >
          Open Demo Bottom Sheet
        </Button>

        <Sheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Demo Sheet"
        >
          <Text variant="body" color="normal" className="mb-4">
            This is a native bottom sheet with dark-first styling, safe-area
            bottom padding, and 16px top border radius.
          </Text>
          <Button variant="primary" onPress={() => setSheetOpen(false)}>
            Close Sheet
          </Button>
        </Sheet>
      </ScrollView>
    </ScreenLayout>
  );
}
