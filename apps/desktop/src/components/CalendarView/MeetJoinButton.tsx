import React from "react";
import { VideoCamera } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import styles from "./CalendarView.module.scss";

export interface MeetJoinButtonProps {
  meetUrl: string;
  onJoin?: (url: string) => void;
  size?: "sm" | "md";
}

export function MeetJoinButton({ meetUrl, onJoin, size = "sm" }: MeetJoinButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(meetUrl);
  };

  return (
    <Button
      variant="primary"
      size={size}
      className={styles["meet-btn"]}
      onClick={handleClick}
      aria-label="Join Google Meet"
      data-testid="meet-join-btn"
    >
      <VideoCamera size={16} weight="bold" className={styles["meet-btn__icon"]} />
      <span>Join Meet</span>
    </Button>
  );
}
