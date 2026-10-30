cask "sophia" do
  version "0.3.0"

  on_arm do
    sha256 "6c2e5d21b63e7de5407d886336d09f511b681893e041ca00407fb58e83a1cdcd"
    url "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/download/v#{version}/Sophia_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "0b21e8cf98df4c332def1c5396d3fbf0438bf388d6c32026ed2392ebf8c4db64"
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
