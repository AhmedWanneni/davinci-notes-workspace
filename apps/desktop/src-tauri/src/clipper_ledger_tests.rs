#[cfg(test)]
mod tests {
  use crate::clipper_ledger::{find_duplicate, ClipperLedgerEntry, MAX_LEDGER_ENTRIES};

  #[test]
  fn test_find_duplicate_matches_by_clip_id() {
    let entries = vec![ClipperLedgerEntry {
      clip_id: "clip-123".to_string(),
      content_hash: "hash-abc".to_string(),
      relative_path: "Clippings/My Note.md".to_string(),
      written_at: 1000,
    }];

    let dup = find_duplicate(&entries, "clip-123", "different-hash", "Different.md");
    expect_dup(&dup, "Clippings/My Note.md");

    let none = find_duplicate(&entries, "clip-999", "different-hash", "Different.md");
    assert!(none.is_none());
  }

  #[test]
  fn test_find_duplicate_matches_by_content_hash_and_path() {
    let entries = vec![ClipperLedgerEntry {
      clip_id: "old-clip".to_string(),
      content_hash: "identical-hash".to_string(),
      relative_path: "Clippings/Article.md".to_string(),
      written_at: 1000,
    }];

    // New clip_id but identical content and target note -> duplicate detected!
    let dup = find_duplicate(&entries, "new-clip", "identical-hash", "Clippings/Article.md");
    expect_dup(&dup, "Clippings/Article.md");

    // Same content but different path -> not duplicate (e.g. user intentionally clipped to another folder)
    let different_path = find_duplicate(&entries, "new-clip", "identical-hash", "Other/Article.md");
    assert!(different_path.is_none());
  }

  #[test]
  fn test_ledger_bounds_constant() {
    assert_eq!(MAX_LEDGER_ENTRIES, 500);
  }

  fn expect_dup(opt: &Option<String>, expected: &str) {
    assert_eq!(opt.as_deref(), Some(expected));
  }
}
