module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "bg": {
          "primary": "#ffffff",
          "primary-alt": "#f6f6f6",
          "secondary": "#f6f6f6",
          "secondary-alt": "#f6f6f6",
          "scrim": "rgb(0 0 0 / 25%)",
          "status-accent": "rgb(127 109 242 / 12%)",
          "status-success": "rgb(46 204 113 / 12%)",
          "status-warning": "rgb(241 196 15 / 12%)",
          "status-error": "rgb(229 83 83 / 12%)",
          "hover": "rgba(0, 0, 0, 0.05)",
          "active": "rgba(0, 0, 0, 0.08)"
        },
        "text": {
          "normal": "#222222",
          "muted": "#5c5c5c",
          "faint": "#ababab",
          "accent": "#7f6df2",
          "on-accent": "#ffffff",
          "error": "#e55353",
          "success": "#2ecc71",
          "warning": "#f1c40f"
        },
        "border": {
          "subtle": "#e4e4e4",
          "normal": "#d4d4d4",
          "focus": "#7f6df2",
          "status-accent": "rgb(127 109 242 / 30%)",
          "status-success": "rgb(46 204 113 / 30%)",
          "status-warning": "rgb(241 196 15 / 30%)",
          "status-error": "rgb(229 83 83 / 30%)"
        },
        "interactive": {
          "accent": "#7f6df2",
          "accent-hover": "#8d7cf4",
          "accent-active": "#6c5ce7"
        },
        "shadow": "rgb(0 0 0 / 12%)",
        "press": {
          "hover": "rgba(0, 0, 0, 0.05)",
          "active": "rgba(0, 0, 0, 0.08)",
          "ripple": "rgba(127, 109, 242, 0.12)",
          "overlay": "rgba(0, 0, 0, 0.08)"
        }
      },
      "spacing": {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "touch-target": "44px"
      },
      "borderRadius": {
        "none": "0px",
        "sm": "2px",
        "md": "4px",
        "lg": "6px",
        "xl": "1rem",
        "bottom-sheet": "16px"
      },
      "borderWidth": {
        "thin": "1px",
        "thick": "2px"
      },
      "fontSize": {
        "xs": [
          "0.75rem",
          {
            "lineHeight": "1.2"
          }
        ],
        "sm": [
          "0.875rem",
          {
            "lineHeight": "1.5"
          }
        ],
        "base": [
          "1rem",
          {
            "lineHeight": "1.5"
          }
        ],
        "lg": [
          "1.25rem",
          {
            "lineHeight": "1.5"
          }
        ],
        "xl": [
          "1.5rem",
          {
            "lineHeight": "1.75"
          }
        ],
        "2xl": [
          "2rem",
          {
            "lineHeight": "1.75"
          }
        ],
        "mobile-body": [
          "16px",
          {
            "lineHeight": "1.4"
          }
        ]
      },
      "fontWeight": {
        "regular": "400",
        "medium": "500",
        "semibold": "600",
        "bold": "700"
      },
      "zIndex": {
        "base": "0",
        "elevated": "10",
        "sticky": "20",
        "dropdown": "50",
        "popover": "50",
        "dialog": "100",
        "modal": "100",
        "overlay": "101",
        "toast": "1000",
        "max": "9999"
      },
      "transitionDuration": {
        "fast": "100ms",
        "base": "180ms",
        "slow": "300ms"
      },
      "transitionTimingFunction": {
        "standard": "cubic-bezier(0.2, 0, 0, 1)"
      }
    }
  }
};
