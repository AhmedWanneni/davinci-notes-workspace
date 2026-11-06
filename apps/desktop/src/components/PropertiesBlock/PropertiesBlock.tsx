import React, { useState } from "react";
import { CaretDown, CaretRight, Plus, Check, X } from "@phosphor-icons/react";
import type { Frontmatter } from "@app/core-types";
import { Typography } from "@app/design-system";
import {
  getPropertyIcon,
  renderPropertyValue,
} from "./PropertyValueRenderer";
import {
  formatPropertyValueForInput,
  normalizeEditedPropertyValue,
} from "./frontmatterMutator";

export interface PropertiesBlockProps {
  frontmatter: Frontmatter;
  onLinkClick?: (target: string) => void;
  onAddProperty?: (key: string, value: unknown) => void;
  onUpdateProperty?: (key: string, value: unknown) => void;
  onRemoveProperty?: (key: string) => void;
}

const HIDDEN_FRONTMATTER_KEYS = new Set([
  "cover", "banner", "cover_y", "banner_y", "coverY", "bannerY",
  "icon", "kanban-plugin", "database", "columns",
]);

export function PropertiesBlock({
  frontmatter,
  onLinkClick,
  onAddProperty,
  onUpdateProperty,
  onRemoveProperty,
}: PropertiesBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const entries = Object.entries(frontmatter).filter(
    ([key]) => !HIDDEN_FRONTMATTER_KEYS.has(key),
  );
  const propertyCount = entries.length;

  const handleConfirmAdd = () => {
    const cleanKey = newKey.trim();
    if (!cleanKey) {
      setIsAdding(false);
      return;
    }
    const parsed = normalizeEditedPropertyValue(cleanKey, newValue);
    onAddProperty?.(cleanKey, parsed);
    setNewKey("");
    setNewValue("");
    setIsAdding(false);
    setIsExpanded(true);
  };

  const handleStartEdit = (key: string, value: unknown) => {
    if (!onUpdateProperty) return;
    setEditingKey(key);
    setEditingValue(formatPropertyValueForInput(key, value));
  };

  const handleConfirmEdit = (key: string, prevValue: unknown) => {
    const parsed = normalizeEditedPropertyValue(key, editingValue, prevValue);
    onUpdateProperty?.(key, parsed);
    setEditingKey(null);
  };

  if (propertyCount === 0 && !isAdding) {
    if (!onAddProperty) return null;
    return (
      <div className="properties-block properties-block--empty">
        <button
          type="button"
          className="properties-block__add-btn"
          onClick={() => {
            setIsAdding(true);
            setIsExpanded(true);
          }}
        >
          <Plus size={12} />
          <span>Add property</span>
        </button>
      </div>
    );
  }

  return (
    <div className="properties-block" data-expanded={isExpanded || undefined}>
      <button
        type="button"
        className="properties-block__header"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="properties-block__chevron" aria-hidden="true">
          {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </span>
        <Typography
          variant="text"
          size="xs"
          weight="semibold"
          className="properties-block__title"
        >
          Properties
        </Typography>
        <span className="properties-block__count">{propertyCount}</span>
      </button>

      {isExpanded && (
        <div className="properties-block__content">
          <div className="properties-block__rows">
            {entries.map(([key, value]) => (
              <div key={key} className="properties-block__row">
                <div className="properties-block__key">
                  <span className="properties-block__key-icon" aria-hidden="true">
                    {getPropertyIcon(key, value)}
                  </span>
                  <span className="properties-block__key-label">{key}</span>
                </div>
                <div
                  className="properties-block__value"
                  onClick={() => {
                    if (editingKey !== key) handleStartEdit(key, value);
                  }}
                >
                  {editingKey === key ? (
                    <input
                      type="text"
                      className="properties-block__input"
                      value={editingValue}
                      autoFocus
                      aria-label={`Edit ${key} value`}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleConfirmEdit(key, value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmEdit(key, value);
                        } else if (e.key === "Escape") {
                          setEditingKey(null);
                        }
                      }}
                    />
                  ) : (
                    renderPropertyValue(value, key, onLinkClick)
                  )}
                </div>
                {onRemoveProperty && (
                  <button
                    type="button"
                    className="properties-block__remove-btn"
                    title={`Remove ${key}`}
                    aria-label={`Remove ${key}`}
                    onClick={() => onRemoveProperty(key)}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}

            {isAdding && (
              <div className="properties-block__row properties-block__row--adding">
                <div className="properties-block__key">
                  <input
                    type="text"
                    className="properties-block__input properties-block__input--key"
                    placeholder="Property name"
                    aria-label="Property name"
                    value={newKey}
                    autoFocus
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleConfirmAdd();
                      } else if (e.key === "Escape") {
                        setIsAdding(false);
                      }
                    }}
                  />
                </div>
                <div className="properties-block__value">
                  <input
                    type="text"
                    className="properties-block__input"
                    placeholder="Value"
                    aria-label="Property value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleConfirmAdd();
                      } else if (e.key === "Escape") {
                        setIsAdding(false);
                      }
                    }}
                  />
                </div>
                <div className="properties-block__add-actions">
                  <button
                    type="button"
                    className="properties-block__action-btn"
                    aria-label="Save property"
                    onClick={handleConfirmAdd}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    className="properties-block__action-btn"
                    aria-label="Cancel add property"
                    onClick={() => setIsAdding(false)}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="properties-block__footer">
            <button
              type="button"
              className="properties-block__add-btn"
              onClick={() => {
                setIsAdding(true);
                setIsExpanded(true);
              }}
            >
              <Plus size={12} />
              <span>Add property</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
