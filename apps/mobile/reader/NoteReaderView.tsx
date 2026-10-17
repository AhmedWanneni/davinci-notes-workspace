import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { CheckSquare, Square } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Divider, Text } from "../components/primitives";
import { PropertiesBlock } from "./PropertiesBlock";
import type {
  BlockNode,
  InlineNode,
  ParsedMarkdownDocument,
} from "./markdownAst";

export interface NoteReaderViewProps {
  document: ParsedMarkdownDocument;
  onWikilinkPress: (target: string, displayText?: string) => void;
  onTagPress: (tag: string) => void;
  onEditPress?: () => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export function NoteReaderView({
  document,
  onWikilinkPress,
  onTagPress,
  onEditPress,
  scrollViewRef,
}: NoteReaderViewProps): React.ReactElement {
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
          <Text
            key={idx}
            variant="body"
            className="line-through text-text-muted"
          >
            {node.text}
          </Text>
        );
      case "code":
        return (
          <Text
            key={idx}
            variant="body"
            className="font-mono bg-bg-secondary px-1 text-accent"
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
            className="underline"
            onPress={() => onWikilinkPress(node.target, node.displayText)}
          >
            {node.displayText || node.target}
          </Text>
        );
      case "tag":
        return (
          <Text
            key={idx}
            variant="body"
            color="accent"
            className="font-medium"
            onPress={() => onTagPress(node.tag)}
          >
            {node.tag}
          </Text>
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
        const variantMap: Record<number, "h1" | "h2" | "h3"> = {
          1: "h1",
          2: "h2",
          3: "h3",
        };
        const variant = variantMap[block.level] || "h3";
        return (
          <View key={idx} className="mt-5 mb-2">
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
            className="my-3 pl-3 border-l-2 border-accent bg-bg-primary-alt/40 py-1"
          >
            <Text variant="body" color="muted" className="italic">
              {block.inlines.map(renderInline)}
            </Text>
          </View>
        );
      case "codeblock":
        return (
          <View
            key={idx}
            className="my-3 p-3 rounded-md border border-border-normal bg-bg-secondary"
          >
            {block.language ? (
              <View className="mb-1 self-start">
                <Badge variant="neutral">{block.language}</Badge>
              </View>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                variant="body"
                className="font-mono text-sm leading-relaxed text-text-normal"
              >
                {block.code}
              </Text>
            </ScrollView>
          </View>
        );
      case "task":
        return (
          <View key={idx} className="flex-row items-center my-1.5 gap-2">
            {block.checked ? (
              <CheckSquare
                size={18}
                color={darkColorTokens.text.accent}
                weight="fill"
              />
            ) : (
              <Square
                size={18}
                color={darkColorTokens.text.muted}
                weight="regular"
              />
            )}
            <View className="flex-1 flex-row flex-wrap">
              {block.inlines.map(renderInline)}
            </View>
          </View>
        );
      case "list-item":
        return (
          <View key={idx} className="flex-row items-start my-1 gap-2 pl-2">
            <Text variant="body" color="muted" className="w-5">
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

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-5 pt-3"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <Pressable onPress={onEditPress}>
        {/* Properties / Frontmatter */}
        <PropertiesBlock
          properties={document.frontmatterData}
          onTagPress={onTagPress}
        />

        {/* Content Blocks */}
        {document.blocks.map(renderBlock)}
      </Pressable>
    </ScrollView>
  );
}
