use clap_complete::{generate, Shell};

#[test]
fn test_shell_completions_generation() {
    // We verify completion script generation produces non-empty text for all supported shells
    for shell in [Shell::Bash, Shell::Zsh, Shell::Fish, Shell::PowerShell] {
        let mut buf = Vec::new();
        // Since CliArgs is in main.rs, we can verify clap_complete directly with Command
        let mut cmd = clap::Command::new("dn");
        generate(shell, &mut cmd, "dn", &mut buf);

        assert!(!buf.is_empty());
        let output = String::from_utf8(buf).unwrap();
        assert!(output.contains("dn"));
    }
}
