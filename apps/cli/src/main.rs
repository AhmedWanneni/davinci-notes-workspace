use clap::{Parser, Subcommand};
use std::io::{stdin, IsTerminal, Read};
use std::path::PathBuf;

use davinci_cli::capture::{capture_note, CaptureTarget};
use davinci_cli::config::resolve_vault;
use davinci_cli::external_editor::launch_external_editor;
use davinci_cli::note_ops::{create_new_note, find_best_match, list_notes};
use davinci_cli::search_engine::search_vault;
use davinci_cli::tui_app::run_tui;

#[derive(Parser, Debug)]
#[command(
    name = "dn",
    author = "DaVinci Notes",
    version,
    about = "DaVinci Notes fast terminal companion"
)]
struct CliArgs {
    #[command(subcommand)]
    command: Option<SubCommand>,

    /// Note text content (or piped via stdin)
    #[arg(num_args = 0..)]
    text: Vec<String>,

    /// Override target vault directory
    #[arg(long, short = 'v', global = true)]
    vault: Option<PathBuf>,

    /// Append to today's daily note (YYYY-MM-DD.md)
    #[arg(long, short = 'd')]
    daily: bool,

    /// Append or create a specific named note
    #[arg(long, short = 'n')]
    note: Option<String>,
}

#[derive(Subcommand, Debug)]
enum SubCommand {
    /// Open note in $EDITOR with fuzzy name matching
    Open { name: String },
    /// Create a new note in the vault
    New { name: String },
    /// List notes in the vault or folder
    Ls { folder: Option<String> },
    /// Print note contents to stdout
    Cat { name: String },
    /// Search content across vault markdown files
    Find { query: String },
}

fn read_input_text(pos_args: &[String]) -> Result<String, String> {
    if !pos_args.is_empty() {
        return Ok(pos_args.join(" "));
    }

    if !stdin().is_terminal() {
        let mut buffer = String::new();
        stdin()
            .read_to_string(&mut buffer)
            .map_err(|e| format!("Failed to read stdin: {e}"))?;
        let trimmed = buffer.trim();
        if !trimmed.is_empty() {
            return Ok(buffer);
        }
    }

    Err("No content provided to capture. Run `dn --help` for usage.".to_string())
}

fn main() {
    let args = CliArgs::parse();

    let vault = match resolve_vault(args.vault.as_deref().and_then(|p| p.to_str())) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    };

    if let Some(cmd) = args.command {
        match cmd {
            SubCommand::Open { name } => match find_best_match(&vault, &name) {
                Some(path) => {
                    if let Err(e) = launch_external_editor(&path) {
                        eprintln!("Failed to launch editor: {e}");
                        std::process::exit(1);
                    }
                }
                None => {
                    eprintln!("No matching note found for: {name}");
                    std::process::exit(1);
                }
            },
            SubCommand::New { name } => match create_new_note(&vault, &name) {
                Ok(path) => println!("Created: {}", path.display()),
                Err(e) => {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                }
            },
            SubCommand::Ls { folder } => {
                let items = list_notes(&vault, folder.as_deref());
                for (name, size) in items {
                    println!("{name:<35} {size:>8} B");
                }
            }
            SubCommand::Cat { name } => match find_best_match(&vault, &name) {
                Some(path) => match std::fs::read_to_string(&path) {
                    Ok(c) => print!("{c}"),
                    Err(e) => {
                        eprintln!("Failed to read file: {e}");
                        std::process::exit(1);
                    }
                },
                None => {
                    eprintln!("No matching note found for: {name}");
                    std::process::exit(1);
                }
            },
            SubCommand::Find { query } => {
                let matches = search_vault(&vault, &query);
                if matches.is_empty() {
                    println!("No matches found for: {query}");
                } else {
                    for m in matches {
                        println!("{}:{}: {}", m.rel_path, m.line_number, m.line_text);
                    }
                }
            }
        }
        return;
    }

    let is_interactive =
        stdin().is_terminal() && args.text.is_empty() && !args.daily && args.note.is_none();
    if is_interactive {
        if let Err(e) = run_tui(vault) {
            eprintln!("TUI Error: {e}");
            std::process::exit(1);
        }
        return;
    }

    let text = match read_input_text(&args.text) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("{e}");
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
        Ok(path) => println!("Captured: {}", path.display()),
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    }
}
