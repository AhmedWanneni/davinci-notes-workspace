pub fn parse_shell_words(cmd_str: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut current = String::new();
    let mut in_single = false;
    let mut in_double = false;
    let mut escaped = false;
    let mut has_token = false;

    for ch in cmd_str.chars() {
        if escaped {
            current.push(ch);
            escaped = false;
            has_token = true;
            continue;
        }

        if ch == '\\' && !in_single {
            escaped = true;
            has_token = true;
            continue;
        }

        if ch == '\'' && !in_double {
            in_single = !in_single;
            has_token = true;
            continue;
        }

        if ch == '"' && !in_single {
            in_double = !in_double;
            has_token = true;
            continue;
        }

        if ch.is_whitespace() && !in_single && !in_double {
            if has_token {
                words.push(current);
                current = String::new();
                has_token = false;
            }
        } else {
            current.push(ch);
            has_token = true;
        }
    }

    if has_token {
        words.push(current);
    }

    words
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple() {
        assert_eq!(parse_shell_words("nvim file.md"), vec!["nvim", "file.md"]);
    }

    #[test]
    fn test_parse_quotes() {
        assert_eq!(
            parse_shell_words("nvim -c 'set wrap' \"my note.md\""),
            vec!["nvim", "-c", "set wrap", "my note.md"]
        );
    }

    #[test]
    fn test_parse_escaped_spaces() {
        assert_eq!(
            parse_shell_words("code\\ editor --wait"),
            vec!["code editor", "--wait"]
        );
    }

    #[test]
    fn test_parse_empty() {
        let empty: Vec<String> = Vec::new();
        assert_eq!(parse_shell_words("   "), empty);
    }
}
