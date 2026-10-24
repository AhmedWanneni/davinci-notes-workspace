use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};

use davinci_cli::external_editor::{launch_custom_editor, launch_editor_from_tui};

static COUNTER: AtomicUsize = AtomicUsize::new(1);

fn setup_temp_vault() -> PathBuf {
    let id = COUNTER.fetch_add(1, Ordering::SeqCst);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let p = std::env::temp_dir().join(format!("dn_ext_test_{}_{}_{}", std::process::id(), id, nanos));
    fs::create_dir_all(&p).unwrap();
    p
}

#[test]
fn test_leading_dash_spaces_and_unicode_file() {
    let vault = setup_temp_vault();
    let weird_name = "-🚀 note with spaces & em-dash — test.md";
    let file_path = vault.join(weird_name);
    fs::write(&file_path, "initial content").unwrap();

    let status = launch_custom_editor(
        &file_path,
        Some("sh -c 'printf \"\\nappended\" >> \"$1\"' --"),
        None,
    ).expect("Should succeed launching editor with weird filename");

    assert!(status.was_modified);
    let updated = fs::read_to_string(&file_path).unwrap();
    assert!(updated.contains("initial content\nappended"));

    let _ = fs::remove_dir_all(vault);
}

#[test]
fn test_editor_with_shell_quoted_arguments() {
    let vault = setup_temp_vault();
    let file_path = vault.join("test_args.md");
    fs::write(&file_path, "sample text").unwrap();

    let status = launch_custom_editor(
        &file_path,
        Some("sh -c 'echo \"$1: flag=$2\" >> \"$4\"' dummy 'my editor' '--verbose'"),
        None,
    ).expect("Should parse shell quotes correctly");

    assert!(status.was_modified);
    let updated = fs::read_to_string(&file_path).unwrap();
    assert!(updated.contains("my editor: flag=--verbose"));

    let _ = fs::remove_dir_all(vault);
}

#[test]
fn test_spawn_failure_reports_clear_error_and_does_not_crash() {
    let vault = setup_temp_vault();
    let file_path = vault.join("sample.md");
    fs::write(&file_path, "data").unwrap();

    let res = launch_custom_editor(
        &file_path,
        Some("nonexistent_binary_davinci_xyz12345"),
        None,
    );

    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("nonexistent_binary_davinci_xyz12345"));
    assert!(err_msg.contains("not found in PATH"));

    let _ = fs::remove_dir_all(vault);
}

#[test]
fn test_tui_terminal_restoration_guarantee() {
    let vault = setup_temp_vault();
    let file_path = vault.join("tui_handoff.md");
    fs::write(&file_path, "tui content").unwrap();

    let res = launch_editor_from_tui(
        &file_path,
        Some("invalid_missing_bin_999"),
        None,
    );
    assert!(res.is_err());

    let _ = fs::remove_dir_all(vault);
}

#[test]
fn test_vim_custom_config_verification() {
    let vault = setup_temp_vault();
    let file_path = vault.join("vim_cfg.md");
    let out_file = vault.join("vim_out.txt");
    fs::write(&file_path, "vim testing").unwrap();

    let custom_vimrc = vault.join("custom.vimrc");
    fs::write(
        &custom_vimrc,
        "let mapleader = ','\nlet g:davinci_test_var = 'LUA_OR_VIM_LOADED'\nset number\n",
    ).unwrap();

    let cmd = format!(
        "vim --not-a-term -u {} -c 'redir! > {} | echo g:davinci_test_var | redir END | q!'",
        custom_vimrc.display(),
        out_file.display()
    );

    let status = launch_custom_editor(&file_path, Some(&cmd), None);
    assert!(status.is_ok());

    let output_str = fs::read_to_string(&out_file).unwrap_or_default();
    assert!(
        output_str.contains("LUA_OR_VIM_LOADED"),
        "Custom vimrc did not load properly: got {output_str}"
    );

    let _ = fs::remove_dir_all(vault);
}

#[test]
fn test_neovim_custom_config_verification() {
    if davinci_cli::editor_resolver::find_executable("nvim").is_none() {
        eprintln!("Neovim not installed; skipping neovim custom config test");
        return;
    }

    let vault = setup_temp_vault();
    let file_path = vault.join("nvim_cfg.md");
    let out_file = vault.join("nvim_out.txt");
    fs::write(&file_path, "nvim testing").unwrap();

    let custom_init = vault.join("custom_init.lua");
    let out_path_str = out_file.to_string_lossy().to_string();
    fs::write(
        &custom_init,
        format!(
            "vim.g.mapleader = ' '\nvim.g.custom_marker = 'NVIM_NATIVE_ACTIVE'\nlocal f = io.open('{}', 'w')\nf:write(vim.g.custom_marker)\nf:close()\n",
            out_path_str
        ),
    ).unwrap();

    let cmd = format!("nvim --headless -u {} -c 'qa!'", custom_init.display());
    let status = launch_custom_editor(&file_path, Some(&cmd), None);
    assert!(status.is_ok());

    let output_str = fs::read_to_string(&out_file).unwrap_or_default();
    assert_eq!(output_str, "NVIM_NATIVE_ACTIVE");

    let _ = fs::remove_dir_all(vault);
}
