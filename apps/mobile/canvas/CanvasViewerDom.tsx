"use dom";

import React, { useState, useRef } from "react";
import { darkColorTokens } from "@app/design-tokens/mobile";
import type { CanvasDocument, CanvasNode } from "./canvasParser";

export interface CanvasViewerDomProps {
  document: CanvasDocument;
  initialScale?: number;
}

export default function CanvasViewerDom({
  document,
  initialScale = 1,
}: CanvasViewerDomProps): React.ReactElement {
  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState({ x: 100, y: 100 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const nodeMap = new Map<string, CanvasNode>();
  document.nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: darkColorTokens.bg["primary-alt"],
        position: "relative",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          display: "flex",
          gap: 8,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          style={{
            background: darkColorTokens.bg.secondary,
            color: darkColorTokens.text.normal,
            border: `1px solid ${darkColorTokens.border.normal}`,
            padding: "6px 12px",
            borderRadius: 4,
          }}
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          style={{
            background: darkColorTokens.bg.secondary,
            color: darkColorTokens.text.normal,
            border: `1px solid ${darkColorTokens.border.normal}`,
            padding: "6px 12px",
            borderRadius: 4,
          }}
        >
          -
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 100, y: 100 });
          }}
          style={{
            background: darkColorTokens.bg.secondary,
            color: darkColorTokens.text.normal,
            border: `1px solid ${darkColorTokens.border.normal}`,
            padding: "6px 12px",
            borderRadius: 4,
          }}
        >
          Reset
        </button>
      </div>

      {/* Canvas World */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Render edges */}
        <svg
          style={{
            position: "absolute",
            top: -2000,
            left: -2000,
            width: 8000,
            height: 8000,
            pointerEvents: "none",
          }}
        >
          {document.edges.map((edge) => {
            const from = nodeMap.get(edge.fromNode);
            const to = nodeMap.get(edge.toNode);
            if (!from || !to) return null;
            const x1 = from.x + from.width / 2 + 2000;
            const y1 = from.y + from.height / 2 + 2000;
            const x2 = to.x + to.width / 2 + 2000;
            const y2 = to.y + to.height / 2 + 2000;
            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={darkColorTokens.border.normal}
                strokeWidth={2}
                strokeDasharray={edge.label ? "4 4" : undefined}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {document.nodes.map((node) => (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              backgroundColor:
                node.type === "group"
                  ? "transparent"
                  : darkColorTokens.bg.secondary,
              border: node.isCycle
                ? `2px dashed ${darkColorTokens.text.error}`
                : `1px solid ${darkColorTokens.border.normal}`,
              borderRadius: 6,
              padding: 8,
              boxSizing: "border-box",
              color: node.isCycle
                ? darkColorTokens.text.error
                : darkColorTokens.text.normal,
              overflow: "hidden",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {node.type === "group" && (
              <div
                style={{ fontWeight: "bold", opacity: 0.7, marginBottom: 4 }}
              >
                {node.label}
              </div>
            )}
            {node.type === "file" && (
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    color: darkColorTokens.interactive.accent,
                    marginBottom: 4,
                  }}
                >
                  📄 {node.file}
                </div>
                {node.nestedCanvas && (
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Nested canvas ({node.nestedCanvas.nodes.length} nodes)
                  </div>
                )}
              </div>
            )}
            {node.type === "text" && (
              <div style={{ whiteSpace: "pre-wrap" }}>{node.text}</div>
            )}
            {node.type === "link" && (
              <div>
                <span style={{ color: darkColorTokens.interactive.accent }}>
                  🔗 {node.url}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
