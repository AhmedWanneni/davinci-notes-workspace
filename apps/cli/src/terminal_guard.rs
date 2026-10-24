use crossterm::cursor::{Hide, SetCursorStyle, Show};
use crossterm::event::{DisableMouseCapture, EnableMouseCapture};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use std::io::{stdout, Write};
use std::panic;

pub struct TerminalGuard {
    active: bool,
}

impl TerminalGuard {
    pub fn new() -> std::io::Result<Self> {
        Self::reenter_terminal()?;

        let prev_hook = panic::take_hook();
        panic::set_hook(Box::new(move |info| {
            let _ = Self::restore_terminal();
            prev_hook(info);
        }));

        Ok(Self { active: true })
    }

    pub fn restore_terminal() -> std::io::Result<()> {
        let mut out = stdout();
        let _ = execute!(
            out,
            Show,
            SetCursorStyle::DefaultUserShape,
            DisableMouseCapture,
            LeaveAlternateScreen
        );
        let _ = out.flush();
        let _ = disable_raw_mode();
        Ok(())
    }

    pub fn reenter_terminal() -> std::io::Result<()> {
        enable_raw_mode()?;
        let mut out = stdout();
        execute!(out, EnterAlternateScreen, EnableMouseCapture, Hide)?;
        out.flush()?;
        Ok(())
    }

    pub fn update_cursor_style(mode: &crate::tui_state::VimMode, in_editor: bool) {
        let mut out = stdout();
        let style = if in_editor {
            match mode {
                crate::tui_state::VimMode::Insert => SetCursorStyle::SteadyBar,
                crate::tui_state::VimMode::Command => SetCursorStyle::SteadyUnderScore,
                crate::tui_state::VimMode::Normal => SetCursorStyle::SteadyBlock,
            }
        } else {
            SetCursorStyle::SteadyBlock
        };
        let _ = execute!(out, style);
        let _ = out.flush();
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        if self.active {
            let _ = Self::restore_terminal();
            self.active = false;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tui_state::VimMode;

    #[test]
    fn test_restore_terminal_does_not_panic() {
        let _ = TerminalGuard::restore_terminal();
    }

    #[test]
    fn test_update_cursor_style_does_not_panic() {
        TerminalGuard::update_cursor_style(&VimMode::Normal, true);
        TerminalGuard::update_cursor_style(&VimMode::Insert, true);
        TerminalGuard::update_cursor_style(&VimMode::Command, true);
        TerminalGuard::update_cursor_style(&VimMode::Normal, false);
    }
}
