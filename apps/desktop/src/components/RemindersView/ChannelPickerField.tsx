import React from "react";
import { Desktop, TelegramLogo, SlackLogo, WhatsappLogo, Phone } from "@phosphor-icons/react";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import styles from "./ChannelPickerField.module.scss";

export interface ChannelPickerFieldProps {
  selectedChannels: DeliveryChannel[];
  onChange: (channels: DeliveryChannel[]) => void;
  disabled?: boolean;
}

const AVAILABLE_CHANNELS: Array<{
  id: DeliveryChannel;
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" }>;
  note: string;
}> = [
  { id: "desktop", label: "Desktop", icon: Desktop, note: "Native app notification" },
  { id: "telegram", label: "Telegram", icon: TelegramLogo, note: "Automatic bot message" },
  { id: "slack", label: "Slack", icon: SlackLogo, note: "Automatic incoming webhook" },
  { id: "whatsapp-click", label: "WhatsApp (Click)", icon: WhatsappLogo, note: "Manual click-to-chat" },
  { id: "whatsapp-callmebot", label: "CallMeBot", icon: Phone, note: "Experimental third-party gateway" },
];

export function ChannelPickerField({
  selectedChannels,
  onChange,
  disabled = false,
}: ChannelPickerFieldProps) {
  const toggleChannel = (channel: DeliveryChannel) => {
    if (disabled) return;
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) return; // keep at least one
      onChange(selectedChannels.filter((c) => c !== channel));
    } else {
      onChange([...selectedChannels, channel]);
    }
  };

  return (
    <div className={styles["channel-picker"]}>
      <label className={styles["channel-picker__label"]}>Notification Channels</label>
      <div className={styles["channel-picker__options"]}>
        {AVAILABLE_CHANNELS.map((ch) => {
          const isSelected = selectedChannels.includes(ch.id);
          const Icon = ch.icon;
          return (
            <button
              key={ch.id}
              type="button"
              className={`${styles["channel-picker__btn"]} ${
                isSelected ? styles["channel-picker__btn--selected"] : ""
              }`}
              onClick={() => toggleChannel(ch.id)}
              disabled={disabled}
              title={ch.note}
              aria-pressed={isSelected}
            >
              <Icon size={16} weight={isSelected ? "fill" : "regular"} />
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>
      <p className={styles["channel-picker__caption"]}>
        Telegram & Slack send automatically. WhatsApp click-to-chat prepares a link for manual sending.
      </p>
    </div>
  );
}
