import React, { useEffect, useState, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import Svg, { Line, Circle, Text as SvgText, G } from "react-native-svg";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Text } from "../components/primitives/Text";
import { Badge } from "../components/primitives/Badge";
import {
  buildLocalGraph,
  type LocalGraphData,
  type LocalGraphNode,
} from "./localGraphModel";

export interface LocalGraphViewProps {
  notePath: string;
  onNavigate: (notePath: string) => void;
  width?: number;
  height?: number;
}

export const LocalGraphView: React.FC<LocalGraphViewProps> = ({
  notePath,
  onNavigate,
  width = 360,
  height = 360,
}) => {
  const [depth, setDepth] = useState<number>(1);
  const [data, setData] = useState<LocalGraphData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    buildLocalGraph(notePath, depth)
      .then((res) => {
        if (!isCancelled) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [notePath, depth]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, LocalGraphNode>();
    data?.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [data]);

  return (
    <View className="flex-1 bg-bg-primary p-3">
      {/* Header controls & honest truncation indicator */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-2">
          <Text variant="caption" color="muted">
            Depth:
          </Text>
          <TouchableOpacity
            onPress={() => setDepth(depth === 1 ? 2 : 1)}
            className="px-2 py-0.5 rounded bg-bg-secondary border border-border-default"
            accessibilityRole="button"
            accessibilityLabel={`Toggle graph depth: currently ${depth} hop`}
          >
            <Text variant="caption" color="accent">
              {depth}-hop
            </Text>
          </TouchableOpacity>
        </View>

        {data?.isTruncated && (
          <Badge variant="warning">
            {`Showing ${data.nodes.length} of ${data.totalConnectedCount + 1}`}
          </Badge>
        )}
      </View>

      {/* SVG Vector Graph Rendering */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="caption" color="muted">
            Loading local graph...
          </Text>
        </View>
      ) : !data || data.nodes.length <= 1 ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="caption" color="muted">
            No connected links found for this note.
          </Text>
        </View>
      ) : (
        <View
          style={{ width, height, alignSelf: "center" }}
          className="rounded-lg bg-bg-surface border border-border-subtle overflow-hidden"
        >
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Edges */}
            {data.edges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;
              return (
                <Line
                  key={edge.id}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={darkColorTokens.border.normal}
                  strokeWidth={1.5}
                />
              );
            })}

            {/* Nodes */}
            {data.nodes.map((node) => (
              <G
                key={node.id}
                onPress={() => {
                  if (!node.isCenter) onNavigate(node.id);
                }}
              >
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isCenter ? 10 : 6}
                  fill={
                    node.isCenter
                      ? darkColorTokens.interactive.accent
                      : darkColorTokens.text.muted
                  }
                  stroke={darkColorTokens.bg.primary}
                  strokeWidth={2}
                />
                <SvgText
                  x={node.x}
                  y={node.y + (node.isCenter ? 18 : 14)}
                  fontSize={10}
                  fill={
                    node.isCenter
                      ? darkColorTokens.text.normal
                      : darkColorTokens.text.muted
                  }
                  textAnchor="middle"
                  fontWeight={node.isCenter ? "bold" : "normal"}
                >
                  {node.label}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      )}
    </View>
  );
};
