import React from "react";
import { Typography } from "@app/design-system";
import { ArrowSquareOut, ShieldCheck, Warning } from "@phosphor-icons/react";
import type { ChannelKind } from "../../notifications";
import styles from "./NotificationsSettingsTab.module.scss";

export interface ChannelPrivacyGuideProps {
  kind: Exclude<ChannelKind, "desktop">;
  onOpenDocsUrl: (url: string) => void;
}

export function ChannelPrivacyGuide({ kind, onOpenDocsUrl }: ChannelPrivacyGuideProps) {
  return (
    <>
      <div className={styles["privacy-banner"]}>
        {kind === "whatsapp-callmebot" ? (
          <Warning size={16} className={styles["warning-icon"]} />
        ) : (
          <ShieldCheck size={16} className={styles["privacy-icon"]} />
        )}
        <div className={styles["privacy-text"]}>
          {kind === "telegram" && (
            <span>
              <strong>Privacy & Secret Storage:</strong> Reminder and message text
              is sent directly from your computer to <code>api.telegram.org</code>.
              Your Bot Token is stored strictly in the OS keychain and never in
              your vault.
            </span>
          )}
          {kind === "slack" && (
            <span>
              <strong>Privacy & Secret Storage:</strong> Reminder and message text
              is posted directly to your Slack Incoming Webhook. Webhook URLs are
              stored strictly in the OS keychain and never synced in your vault.
            </span>
          )}
          {kind === "whatsapp-click" && (
            <span>
              <strong>Manual Final Step Required:</strong> WhatsApp does not allow
              automatic background sending without a business server. When due,
              Sophia gives you a 1-click <em>Send on WhatsApp</em> button
              that opens <code>wa.me</code> with your message prefilled so you can
              press Send.
            </span>
          )}
          {kind === "whatsapp-callmebot" && (
            <span>
              <strong>Experimental · Third-Party Service:</strong> Message text and
              your phone number pass through <code>api.callmebot.com</code>. Free
              tier appends a watermark and limits rate to 1 message / 2s.
            </span>
          )}
        </div>
      </div>

      {kind === "telegram" && (
        <div className={styles["setup-steps"]}>
          <Typography variant="text" size="xs" weight="bold">
            Quick Setup (Telegram BotFather):
          </Typography>
          <ol className={styles["steps-list"]}>
            <li>
              Message <code>@BotFather</code> on Telegram and send <code>/newbot</code> to get a Bot Token.
            </li>
            <li>
              Open your new bot and click <strong>Start</strong> (or add the bot to a group).
            </li>
            <li>
              Paste your Bot Token and your personal or group <code>chat_id</code> below.
            </li>
          </ol>
          <button
            type="button"
            className={styles["docs-link"]}
            onClick={() =>
              onOpenDocsUrl("https://core.telegram.org/bots#how-do-i-create-a-bot")
            }
          >
            <span>Official Telegram Bot Guide</span>
            <ArrowSquareOut size={12} />
          </button>
        </div>
      )}

      {kind === "slack" && (
        <div className={styles["setup-steps"]}>
          <Typography variant="text" size="xs" weight="bold">
            Quick Setup (Slack Incoming Webhooks):
          </Typography>
          <ol className={styles["steps-list"]}>
            <li>
              Create a Slack App for your workspace and enable <strong>Incoming Webhooks</strong>.
            </li>
            <li>
              Click <strong>Add New Webhook to Workspace</strong> and choose a channel or DM.
            </li>
            <li>
              Paste the <code>https://hooks.slack.com/services/...</code> URL below.
            </li>
          </ol>
          <button
            type="button"
            className={styles["docs-link"]}
            onClick={() =>
              onOpenDocsUrl("https://api.slack.com/messaging/webhooks")
            }
          >
            <span>Official Slack Webhooks Docs</span>
            <ArrowSquareOut size={12} />
          </button>
        </div>
      )}
    </>
  );
}
