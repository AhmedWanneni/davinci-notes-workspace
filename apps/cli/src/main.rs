use clap::Parser;
use std::io::{stdin, IsTerminal, Read};
use std::path::PathBuf;

use davinci_cli::capture::{capture_note, CaptureTarget};
use davinci_cli::config::resolve_vault;

#[derive(Parser, Debug)]
#[command(
    name = "dn",
    author = "DaVinci Notes",
    version,
    about = "DaVinci Notes fast terminal companion"
)]
struct CliArgs {
    /// Note text content (or piped via stdin)
    #[arg(num_args = 0..)]
    text: Vec<String>,

    /// Override target vault directory
    #[arg(long, short = 'v')]
    vault: Option<PathBuf>,

    /// Append to today's daily note (YYYY-MM-DD.md)
    #[arg(long, short = 'd')]
    daily: bool,

    /// Append or create a specific named note
    #[arg(long, short = 'n')]
    note: Option<String>,
}

fn read_input_text(pos_args: &[String]) -> Result<String, String> {
    if !pos_args.is_empty() {
        return Ok(pos_args.join(" "));
    }

    let is_term = stdin().is_terminal();
    if !is_term {
        let mut buffer = String::new();
        stdin()
            .read_to_string(&mut buffer)
            .map_err(|e| format!("Failed to read stdin: {e}"))?;
        let trimmed = buffer.trim();
        if !trimmed.is_empty() {
            return Ok(buffer);
        }
    }

    Err("No content provided to capture.\n\
         Usage:\n  \
           dn \"your thought here\"\n  \
           echo \"idea\" | dn\n  \
           dn --daily \"task item\"\n  \
           dn --note \"Project Plan\" \"agenda item\"\n\n\
         Run `dn --help` for full options."
        .to_string())
}

fn main() {
    let args = CliArgs::parse();

    let text = match read_input_text(&args.text) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    };

    let vault = match resolve_vault(args.vault.as_deref().and_then(|p| p.to_str())) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    };

    let target = if args.daily {
        CaptureTarget::Daily
    } else if let Some(n) = args.note {
        CaptureTarget::CustomNote(n)
    } else {
        CaptureTarget::QuickNotes
    };

    match capture_note(&vault, target, &text) {
        Ok(path) => {
            println!("Captured: {}", path.display());
        }
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    }
}
