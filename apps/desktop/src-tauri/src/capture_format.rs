use std::time::SystemTime;

pub fn format_capture_entry(text: &str, timestamp: &str, eol: &str) -> String {
  let lines: Vec<&str> = text.lines().collect();
  if lines.is_empty() {
    return String::new();
  }
  let mut result = format!("- [{timestamp}] {}", lines[0]);
  for line in lines.iter().skip(1) {
    result.push_str(eol);
    result.push_str("  ");
    result.push_str(line);
  }
  result.push_str(eol);
  result
}

pub fn format_iso_timestamp(now: SystemTime) -> String {
  let secs = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
  let sec = secs % 60;
  let mins = secs / 60;
  let min = mins % 60;
  let hours = mins / 60;
  let hour = hours % 24;
  let mut days = hours / 24;

  let mut year = 1970;
  loop {
    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let days_in_year = if leap { 366 } else { 365 };
    if days >= days_in_year {
      days -= days_in_year;
      year += 1;
    } else {
      break;
    }
  }
  let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
  let days_in_months = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let mut month = 1;
  for &dim in &days_in_months {
    if days >= dim {
      days -= dim;
      month += 1;
    } else {
      break;
    }
  }
  let day = days + 1;
  format!("{year:04}-{month:02}-{day:02} {hour:02}:{min:02}:{sec:02}")
}
