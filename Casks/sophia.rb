cask "sophia" do
  version "0.1.0"

  on_arm do
    sha256 "f9634551f926114a72af6c67c95e0e2cf356c09b8cdc2c57cfc6ccd5a983203c"
    url "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/download/v#{version}/Sophia_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 :no_check
    url "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/download/v#{version}/Sophia_#{version}_x64.dmg"
  end

  name "Sophia"
  desc "Local-first, privacy-focused knowledge base and networked note-taking app"
  homepage "https://sophia-notes.pages.dev"

  auto_updates false
  depends_on macos: :big_sur

  app "Sophia.app"

  zap trash: [
    "~/Library/Application Support/com.sophia.notes",
    "~/Library/Caches/com.sophia.notes",
    "~/Library/Preferences/com.sophia.notes.plist",
    "~/Library/Saved Application State/com.sophia.notes.savedState",
  ]
end
