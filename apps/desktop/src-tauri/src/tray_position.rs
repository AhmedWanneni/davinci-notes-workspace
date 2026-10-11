use tauri::{AppHandle, PhysicalPosition, PhysicalSize, Rect, WebviewWindow};

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

/// Computes the physical position for anchoring the quick capture popover window
/// relative to the tray icon bounds, clamped strictly to the monitor's work area.
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
  let gap = (4.0 * scale_factor).round() as i32;

  // Horizontal placement: center under tray icon, clamped to work area
  let icon_center_x = icon.x + (icon.width as i32 / 2);
  let desired_x = icon_center_x - (win_w / 2);
  let min_x = work_area.x + margin;
  let max_x = (work_area.x + work_w - win_w - margin).max(min_x);
  let clamped_x = desired_x.clamp(min_x, max_x);

  // Vertical placement:
  // If icon is in upper half of work area (e.g. macOS menu bar, top taskbar),
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

pub fn find_popover_position(
  app: &AppHandle,
  window: Option<&WebviewWindow>,
  rect: &Rect,
) -> Option<PhysicalPosition<i32>> {
  let monitors = app.available_monitors().ok()?;
  if monitors.is_empty() {
    return None;
  }

  let mut target_monitor = None;
  for monitor in &monitors {
    let scale = monitor.scale_factor();
    let icon_pos = rect.position.to_physical::<i32>(scale);
    let mon_x = monitor.position().x;
    let mon_y = monitor.position().y;
    let mon_w = monitor.size().width as i32;
    let mon_h = monitor.size().height as i32;

    if icon_pos.x >= mon_x && icon_pos.x < mon_x + mon_w && icon_pos.y >= mon_y && icon_pos.y < mon_y + mon_h {
      target_monitor = Some(monitor.clone());
      break;
    }
  }

  let monitor = target_monitor
    .or_else(|| app.primary_monitor().ok().flatten())
    .unwrap_or_else(|| monitors[0].clone());

  let scale = monitor.scale_factor();
  let icon_pos = rect.position.to_physical::<i32>(scale);
  let icon_size = rect.size.to_physical::<u32>(scale);
  let work_area = monitor.work_area();

  let win_size = window
    .and_then(|w| w.outer_size().ok())
    .unwrap_or_else(|| PhysicalSize::new((640.0 * scale).round() as u32, (340.0 * scale).round() as u32));

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
