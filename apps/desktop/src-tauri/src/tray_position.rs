#[allow(unused_imports)]
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Position, Rect, Size, WebviewWindow};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WorkArea {
  pub x: i32,
  pub y: i32,
  pub width: u32,
  pub height: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TrayIconBounds {
  pub x: i32,
  pub y: i32,
  pub width: u32,
  pub height: u32,
}

/// Pure placement math in physical pixels:
/// Computes the physical position for anchoring the quick capture popover window
/// horizontally centered on the tray icon bounds and clamped strictly inside the monitor work area.
pub fn calculate_popover_position(
  icon: TrayIconBounds,
  window_size: PhysicalSize<u32>,
  work_area: WorkArea,
  scale_factor: f64,
) -> PhysicalPosition<i32> {
  let win_w = window_size.width as i32;
  let win_h = window_size.height as i32;
  let work_w = work_area.width as i32;
  let work_h = work_area.height as i32;

  let margin = (8.0 * scale_factor).round() as i32;
  let gap = (2.0 * scale_factor).round() as i32;

  // Horizontal placement: center under tray icon, clamped to work area
  let icon_center_x = icon.x + (icon.width as i32 / 2);
  let desired_x = icon_center_x - (win_w / 2);
  let min_x = work_area.x + margin;
  let max_x = (work_area.x + work_w - win_w - margin).max(min_x);
  let clamped_x = desired_x.clamp(min_x, max_x);

  // Vertical placement:
  // If icon is in upper half of monitor work area (e.g. macOS menu bar, top taskbar),
  // anchor directly BELOW the icon.
  // If icon is in lower half (e.g. Windows bottom taskbar),
  // anchor directly ABOVE the icon.
  let work_mid_y = work_area.y + (work_h / 2);
  let (desired_y, min_y, max_y) = if icon.y < work_mid_y {
    let des_y = icon.y + icon.height as i32 + gap;
    let min_y = work_area.y;
    let max_y = (work_area.y + work_h - win_h - margin).max(min_y);
    (des_y, min_y, max_y)
  } else {
    let des_y = icon.y - win_h - gap;
    let min_y = work_area.y + margin;
    let max_y = (work_area.y + work_h - win_h).max(min_y);
    (des_y, min_y, max_y)
  };
  let clamped_y = desired_y.clamp(min_y, max_y);

  PhysicalPosition::new(clamped_x, clamped_y)
}

/// Queries tray handle, last-known click rect, or defined default fallback.
pub fn resolve_tray_rect_or_fallback(
  app: &AppHandle,
  last_known: Option<Rect>,
) -> Rect {
  #[cfg(all(desktop, not(target_os = "linux")))]
  if let Some(tray) = app.tray_by_id("davinci-tray") {
    if let Ok(Some(rect)) = tray.rect() {
      return rect;
    }
  }

  if let Some(known) = last_known {
    return known;
  }

  // Defined default fallback: near top-right of primary monitor
  let monitor = app
    .primary_monitor()
    .ok()
    .flatten()
    .or_else(|| app.available_monitors().ok().and_then(|m| m.into_iter().next()));

  let (work_x, work_y, work_w, scale) = if let Some(m) = monitor {
    let wa = m.work_area();
    (wa.position.x, wa.position.y, wa.size.width as i32, m.scale_factor())
  } else {
    (0, 25, 1440, 1.0)
  };

  let icon_w = (28.0 * scale).round() as u32;
  let icon_h = (24.0 * scale).round() as u32;
  let fallback_x = work_x + work_w - (icon_w as i32 * 4);

  Rect {
    position: Position::Physical(PhysicalPosition::new(fallback_x, work_y)),
    size: Size::Physical(PhysicalSize::new(icon_w, icon_h)),
  }
}

pub fn find_popover_position(
  app: &AppHandle,
  window: Option<&WebviewWindow>,
  rect: &Rect,
) -> Option<PhysicalPosition<i32>> {
  let monitors = app.available_monitors().ok()?;
  if monitors.is_empty() {
    return None;
  }

  let primary = app.primary_monitor().ok().flatten().unwrap_or_else(|| monitors[0].clone());
  let primary_scale = primary.scale_factor();
  let temp_pos = rect.position.to_physical::<i32>(primary_scale);
  let temp_size = rect.size.to_physical::<u32>(primary_scale);
  let icon_center = (
    temp_pos.x + (temp_size.width as i32 / 2),
    temp_pos.y + (temp_size.height as i32 / 2),
  );

  let mut target_monitor = None;
  for monitor in &monitors {
    let mon_x = monitor.position().x;
    let mon_y = monitor.position().y;
    let mon_w = monitor.size().width as i32;
    let mon_h = monitor.size().height as i32;

    if icon_center.0 >= mon_x
      && icon_center.0 < mon_x + mon_w
      && icon_center.1 >= mon_y
      && icon_center.1 < mon_y + mon_h
    {
      target_monitor = Some(monitor.clone());
      break;
    }
  }

  let monitor = target_monitor.unwrap_or(primary);
  let scale = monitor.scale_factor();
  let icon_pos = rect.position.to_physical::<i32>(scale);
  let icon_size = rect.size.to_physical::<u32>(scale);
  let work_area = monitor.work_area();

  // Read the real window size at placement time, falling back to default geometry if not yet created.
  let win_size = window
    .and_then(|w| w.outer_size().ok())
    .unwrap_or_else(|| PhysicalSize::new((780.0 * scale).round() as u32, (520.0 * scale).round() as u32));

  let icon_bounds = TrayIconBounds {
    x: icon_pos.x,
    y: icon_pos.y,
    width: icon_size.width,
    height: icon_size.height,
  };
  let work_bounds = WorkArea {
    x: work_area.position.x,
    y: work_area.position.y,
    width: work_area.size.width,
    height: work_area.size.height,
  };

  Some(calculate_popover_position(
    icon_bounds,
    win_size,
    work_bounds,
    scale,
  ))
}
