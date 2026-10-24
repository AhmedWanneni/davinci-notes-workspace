import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Check } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Badge, Divider, Text } from "../components/primitives";
import { PropertiesBlock } from "./PropertiesBlock";
import type {
  BlockNode,
  InlineNode,
  ParsedMarkdownDocument,
} from "./markdownAst";

export interface NoteReaderViewProps {
  document: ParsedMarkdownDocument;
  title?: string;
  onWikilinkPress: (target: string, displayText?: string) => void;
  onTagPress: (tag: string) => void;
  onEditPress?: () => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export function NoteReaderView({
  document,
  title,
  onWikilinkPress,
  onTagPress,
  onEditPress,
  scrollViewRef,
}: NoteReaderViewProps): React.ReactElement {
  const { tokens } = useTheme();

  const renderInline = (node: InlineNode, idx: number): React.ReactNode => {
    switch (node.type) {
      case "bold":
        return (
          <Text key={idx} variant="body" weight="bold">
            {node.text}
          </Text>
        );
      case "italic":
        return (
          <Text key={idx} variant="body" className="italic">
            {node.text}
          </Text>
        );
      case "strike":
        return (
          <Text key={idx} variant="body" color="muted" className="line-through">
            {node.text}
          </Text>
        );
      case "code":
        return (
          <Text
            key={idx}
            variant="body"
            color="accent"
            className="font-mono px-1 rounded"
            style={{ backgroundColor: tokens.color.bg.secondary }}
          >
            {node.text}
          </Text>
        );
      case "wikilink":
        return (
          <Text
            key={idx}
            variant="body"
            weight="medium"
            color="accent"
            onPress={() => onWikilinkPress(node.target, node.displayText)}
          >
            {node.displayText || node.target}
          </Text>
        );
      case "tag":
        return (
          <Pressable
            key={idx}
            onPress={() => onTagPress(node.tag)}
            style={{
              backgroundColor: tokens.color.bg["status-accent"],
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              marginRight: 8,
              marginVertical: 4,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: tokens.color.interactive.accent,
              }}
            >
              {node.tag}
            </Text>
          </Pressable>
        );
      case "link":
        return (
          <Text key={idx} variant="body" color="accent" className="underline">
            {node.text}
          </Text>
        );
      case "text":
      default:
        return (
          <Text key={idx} variant="body" color="normal">
            {node.text}
          </Text>
        );
    }
  };

  const renderBlock = (block: BlockNode, idx: number): React.ReactNode => {
    switch (block.type) {
      case "heading": {
        const variant =
          block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
        return (
          <View key={idx} className="mt-4 mb-2">
            <Text variant={variant} weight="bold" color="normal">
              {block.inlines.map(renderInline)}
            </Text>
          </View>
        );
      }
      case "blockquote":
        return (
          <View
            key={idx}
            style={{
              marginVertical: 8,
              borderLeftWidth: 2,
              borderLeftColor: tokens.color.interactive.accent,
              paddingLeft: 12,
              paddingVertical: 4,
            }}
          >
            <Text variant="body" color="normal">
              {block.inlines.map(renderInline)}
            </Text>
          </View>
        );
      case "codeblock":
        return (
          <View
            key={idx}
            className="my-3 p-3 rounded-md border"
            style={{
              backgroundColor: tokens.color.bg.secondary,
              borderColor: tokens.color.border.normal,
            }}
          >
            {block.language ? (
              <View className="mb-1 self-start">
                <Badge variant="neutral">{block.language}</Badge>
              </View>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                variant="body"
                className="font-mono text-sm leading-relaxed"
                color="normal"
              >
                {block.code}
              </Text>
            </ScrollView>
          </View>
        );
      case "task":
        return (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 4,
              gap: 8,
              paddingLeft: (block.depth ?? 0) * 16,
            }}
          >
            {block.checked ? (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: tokens.color.interactive.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check
                  size={12}
                  color={tokens.color.text["on-accent"]}
                  weight="bold"
                />
              </View>
            ) : (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: tokens.color.border.normal,
                }}
              />
            )}
            <View className="flex-1 flex-row flex-wrap">
              {block.inlines.map(renderInline)}
            </View>
          </View>
        );
      case "list-item":
        return (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginVertical: 4,
              gap: 8,
              paddingLeft: 4 + (block.depth ?? 0) * 16,
            }}
          >
            <Text variant="body" color="muted" style={{ width: 16 }}>
              {block.ordered ? `${block.index}.` : "•"}
            </Text>
            <View className="flex-1 flex-row flex-wrap">
              {block.inlines.map(renderInline)}
            </View>
          </View>
        );
      case "divider":
        return (
          <View key={idx} className="my-4">
            <Divider />
          </View>
        );
      case "paragraph":
      default:
        return (
          <View key={idx} className="my-1.5 flex-row flex-wrap leading-relaxed">
            {block.inlines.map(renderInline)}
          </View>
        );
    }
  };

  const hasMatchingFirstHeading =
    document.blocks.length > 0 &&
    document.blocks[0].type === "heading" &&
    document.blocks[0].level === 1;

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-5 pt-3"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <Pressable onPress={onEditPress} style={{ flex: 1, minHeight: 450 }}>
        {title && !hasMatchingFirstHeading ? (
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: tokens.color.text.normal,
              lineHeight: 32,
              marginBottom: 12,
            }}
          >
            {title}
          </Text>
        ) : null}
        <PropertiesBlock
          properties={document.frontmatterData}
          onTagPress={onTagPress}
        />
        {document.blocks.map(renderBlock)}
      </Pressable>
    </ScrollView>
  );
}
