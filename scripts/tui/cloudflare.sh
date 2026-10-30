#!/usr/bin/env bash
# cloudflare.sh — Cloudflare CLI & Pages deployment controller for DaVinci Notes
set -euo pipefail

cloudflare_open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url"
  elif command -v start >/dev/null 2>&1; then
    start "$url"
  else
    printf "  ${C_MUTED}Please open in browser:${C_RESET} %s\n" "$url"
  fi
}

cloudflare_check_wrangler() {
  if ! command -v wrangler >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

cloudflare_get_auth_info() {
  if ! cloudflare_check_wrangler; then
    echo "NOT_INSTALLED"
    return
  fi
  local output
  output="$(wrangler whoami 2>&1 || true)"
  if echo "$output" | grep -qi "associated with the email"; then
    local email
    email="$(echo "$output" | grep -i "associated with the email" | sed -E 's/.*email ([^ .]+).*/\1/' || true)"
    echo "LOGGED_IN:${email:-Cloudflare User}"
  elif echo "$output" | grep -qi "Logged in"; then
    echo "LOGGED_IN:Cloudflare User"
  else
    echo "NOT_LOGGED_IN"
  fi
}

cloudflare_load_env() {
  local repo_root="$1"
  if [[ -f "${repo_root}/.env" ]]; then
    while IFS='=' read -r key val || [[ -n "$key" ]]; do
      [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
      key="$(echo "$key" | tr -d '\r ')"
      val="$(echo "$val" | tr -d '\r"' | sed "s/^'//;s/'$//")"
      if [[ -z "${!key:-}" && -n "$key" ]]; then
        export "$key"="$val"
      fi
    done < "${repo_root}/.env"
  fi
}

cloudflare_ensure_oauth() {
  local repo_root="${1:-}"
  if [[ -n "$repo_root" ]]; then
    cloudflare_load_env "$repo_root"
  fi
  local auth_status
  auth_status="$(cloudflare_get_auth_info)"
  if [[ "$auth_status" == "NOT_LOGGED_IN" ]]; then
    printf "\n  ${C_YELLOW}⚠️  Not connected to Cloudflare yet.${C_RESET}\n"
    printf "  ${C_CYAN}${C_BOLD}Opening Cloudflare OAuth login in your default browser...${C_RESET}\n\n"
    wrangler login || true
    auth_status="$(cloudflare_get_auth_info)"
    if [[ "$auth_status" == "NOT_LOGGED_IN" ]]; then
      ui_warn "Authentication not completed. Please authorize in your browser or set CLOUDFLARE_API_TOKEN."
      return 1
    fi
    ui_success "Cloudflare authentication succeeded!"
    sleep 1
  fi
  return 0
}

cloudflare_deploy_flow() {
  local repo_root="$1"
  local project_name="${2:-sophia-notes}"
  local branch
  branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")"

  # Ensure user is authenticated via OAuth; if not, open browser OAuth immediately
  if ! cloudflare_ensure_oauth; then
    read -r -p "  Press Enter to return to menu..." _
    return 1
  fi

  ui_clear
  printf "\n  ${C_CYAN}${C_BOLD}🚀 Deploying Sophia Notes Website to Cloudflare Pages${C_RESET}\n\n"
  printf "  ${C_MUTED}Project Name :${C_RESET} ${C_BOLD}%s${C_RESET}\n" "$project_name"
  printf "  ${C_MUTED}Git Branch   :${C_RESET} ${C_BOLD}%s${C_RESET}\n" "$branch"
  printf "  ${C_MUTED}Build Output :${C_RESET} ${C_BOLD}apps/website/dist${C_RESET}\n\n"

  printf "  ${C_YELLOW}Step 1/2: Compiling Astro production static build...${C_RESET}\n"
  if ! (cd "$repo_root" && pnpm --filter @app/website build); then
    ui_error "Website build failed. Check error log above."
    read -r -p "  Press Enter to return..." _
    return 1
  fi
  printf "  ${C_GREEN}✔ Production build ready in apps/website/dist!${C_RESET}\n\n"

  printf "  ${C_YELLOW}Step 2/2: Uploading static assets via Cloudflare OAuth...${C_RESET}\n"
  local deploy_output
  deploy_output="$(cd "$repo_root" && wrangler pages deploy apps/website/dist --project-name "$project_name" --branch "$branch" 2>&1)" || {
    printf "%s\n" "$deploy_output"
    ui_error "Cloudflare Pages deployment failed."
    read -r -p "  Press Enter to return..." _
    return 1
  }

  printf "%s\n\n" "$deploy_output"
  ui_success "Deployment complete on Cloudflare Pages!"

  local deploy_url
  deploy_url="$(echo "$deploy_output" | grep -Eo 'https://[^ >]+pages\.dev' | head -n 1 || true)"
  if [[ -n "$deploy_url" ]]; then
    printf "  ${C_BOLD}Live Website URL:${C_RESET} ${C_CYAN}${deploy_url}${C_RESET}\n\n"
    printf "  Open live website in default browser? [Y/n]: "
    local open_ans
    read -r open_ans || true
    if [[ ! "$open_ans" =~ ^[Nn]$ ]]; then
      cloudflare_open_url "$deploy_url"
    fi
  fi
  read -r -p "  Press Enter to return to menu..." _
}

cloudflare_create_project_flow() {
  local repo_root="$1"
  if ! cloudflare_ensure_oauth; then
    read -r -p "  Press Enter to return to menu..." _
    return 1
  fi

  printf "\n  ${C_CYAN}${C_BOLD}Enter Cloudflare Pages Project Name [sophia-notes]:${C_RESET} "
  local proj
  read -r proj || true
  proj="${proj:-sophia-notes}"

  printf "  Initializing Pages project '%s'...\n" "$proj"
  wrangler pages project create "$proj" --production-branch "main" || true
  ui_success "Project configuration initialized on Cloudflare."
  read -r -p "  Press Enter to return..." _
}

cloudflare_open_connect_github() {
  printf "\n  ${C_CYAN}${C_BOLD}Opening Cloudflare Pages in Default Browser...${C_RESET}\n\n"
  printf "  ${C_BOLD}Recommended Git Settings in Cloudflare Dashboard:${C_RESET}\n"
  printf "    ${C_MUTED}1. Connect GitHub Repository:${C_RESET}  ${C_CYAN}AhmedWanneni/davinci-notes-workspace${C_RESET}\n"
  printf "    ${C_MUTED}2. Framework Preset         :${C_RESET}  ${C_BOLD}Astro${C_RESET}\n"
  printf "    ${C_MUTED}3. Root Directory           :${C_RESET}  ${C_BOLD}apps/website${C_RESET}\n"
  printf "    ${C_MUTED}4. Build Command            :${C_RESET}  ${C_BOLD}pnpm build${C_RESET}\n"
  printf "    ${C_MUTED}5. Output Directory         :${C_RESET}  ${C_BOLD}dist${C_RESET}\n"
  printf "    ${C_MUTED}6. Environment Variable     :${C_RESET}  ${C_BOLD}NODE_VERSION = 20${C_RESET}\n\n"

  cloudflare_open_url "https://dash.cloudflare.com/?to=/:account/pages/new/provider/github"
  read -r -p "  Press Enter to return..." _
}

cloudflare_menu() {
  local repo_root="$1"
  cloudflare_load_env "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"

    local auth_status
    auth_status="$(cloudflare_get_auth_info)"

    ui_section "Cloudflare Pages Deployment (Browser OAuth)" "☁️ "

    if [[ "$auth_status" == "NOT_INSTALLED" ]]; then
      printf "  ${C_RED}✘ Wrangler CLI not detected on system path.${C_RESET}\n"
      printf "  ${C_MUTED}Install it to use automatic browser OAuth deployment.${C_RESET}\n\n"
      ui_menu_item "1" "📦" "Install Wrangler CLI" "Run 'npm install -g wrangler'"
      ui_menu_item "2" "🌐" "Open Cloudflare in Browser" "Deploy GitHub repository via web UI"
      ui_menu_item "0" "↩ " "Back to Main Menu" ""
      ui_section_end
      printf "  ${C_CYAN}${C_BOLD}Select an option [0-2]:${C_RESET} "

      local choice
      read -r choice || break
      case "$choice" in
        1)
          printf "  Installing wrangler globally...\n"
          npm install -g wrangler || pnpm add -g wrangler
          sleep 1
          ;;
        2) cloudflare_open_connect_github ;;
        0|q|Q) break ;;
      esac
      continue
    fi

    if [[ "$auth_status" == "NOT_LOGGED_IN" ]]; then
      printf "  ${C_YELLOW}⚠️  Not connected to Cloudflare.${C_RESET}\n"
      printf "  ${C_MUTED}Connect instantly via browser OAuth (no manual API tokens needed).${C_RESET}\n\n"
      ui_menu_item "1" "🔑" "Open Browser OAuth Login" "Runs 'wrangler login' to authorize"
      ui_menu_item "2" "🚀" "Build & Deploy Now" "Opens browser OAuth, then deploys website"
      ui_menu_item "3" "🌐" "Open Cloudflare Dashboard" "Connect GitHub repo in browser web UI"
      ui_menu_item "0" "↩ " "Back to Main Menu" ""
      ui_section_end
      printf "  ${C_CYAN}${C_BOLD}Select an option [0-3]:${C_RESET} "

      local choice
      read -r choice || break
      case "$choice" in
        1)
          printf "  Opening browser for Cloudflare OAuth login...\n"
          wrangler login || true
          ;;
        2) cloudflare_deploy_flow "$repo_root" "sophia-notes" ;;
        3) cloudflare_open_connect_github ;;
        0|q|Q) break ;;
      esac
      continue
    fi

    # Authenticated via OAuth
    local account_label="${auth_status#LOGGED_IN:}"
    printf "  ${C_GREEN}✔ Cloudflare OAuth Connected${C_RESET} ${C_MUTED}(%s)${C_RESET}\n\n" "$account_label"
    ui_menu_item "1" "🚀" "Build & Deploy Website" "Build Astro site and deploy to Pages"
    ui_menu_item "2" "📁" "Create Pages Project" "Initialize 'sophia-notes' project"
    ui_menu_item "3" "🌐" "Open Cloudflare Dashboard" "Manage Pages, custom domains & analytics"
    ui_menu_item "4" "🐙" "Connect GitHub in Browser" "Configure auto-deploy on git push"
    ui_menu_item "5" "🔄" "Re-open Browser OAuth" "Switch account or refresh OAuth session"
    ui_menu_item "0" "↩ " "Back to Main Menu" ""
    ui_section_end
    printf "  ${C_CYAN}${C_BOLD}Select an option [0-5]:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1) cloudflare_deploy_flow "$repo_root" "sophia-notes" ;;
      2) cloudflare_create_project_flow "$repo_root" ;;
      3) cloudflare_open_url "https://dash.cloudflare.com/?to=/:account/pages" ;;
      4) cloudflare_open_connect_github ;;
      5) wrangler login || true ;;
      0|q|Q) break ;;
    esac
  done
}
