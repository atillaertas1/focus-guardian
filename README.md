# 🛡️ Focus Guardian

**Modern Pomodoro & Distraction Blocker Desktop App**

Focus Guardian is an open-source productivity tool that helps you stay focused by blocking distracting websites during your work sessions. Built with Electron and React, it features a professional UI, robust system integration, and cross-platform support.

---

## ✨ Features

- **Customizable Pomodoro Timer**: Quick presets (5, 15, 25, 45, 60 min) and manual input
- **Website Blocker**: Blocks selected sites during focus sessions
- **Automatic Unblock**: Restores access when timer ends
- **Persistent Settings**: All preferences saved securely
- **Break Sessions**: Auto-start and customizable break times
- **Emergency Access**: Instantly restore site access if needed
- **Professional UI**: Modern, responsive, dark/light themes
- **Desktop Notifications**: Session start/end alerts
- **Admin Permission Checks**: Secure system file access
- **Crash Recovery**: Automatic hosts file restore

---

## 🚀 Installation

### Requirements
- Node.js v14+
- Windows 10/11, macOS, or Linux
- Administrator rights (for hosts file editing)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/focus-guardian.git
cd focus-guardian
npm install
npm start
```

### Packaging
```bash
npm run make
# Output: out/make/
```

## 🎮 Usage

1. **Set Blocked Sites**: Enter sites to block (one per line) and save.
2. **Start Timer**: Choose duration and start. Sites are blocked during session.
3. **Breaks**: Auto or manual break sessions with site access restored.
4. **Emergency Access**: Use the button to instantly unblock if needed.
5. **Theme Switch**: Toggle dark/light mode anytime.

---

## ⚙️ How It Works

Focus Guardian combines the Pomodoro technique with system-level website blocking to maximize your productivity:

1. **Session Start**: When you start a timer, the app saves your current hosts file and adds entries to block the websites you selected (using 127.0.0.1 and ::1 for both www and naked domains).
2. **System Integration**: Hosts file changes require administrator rights. The app requests permission and safely edits the file. DNS cache is flushed to ensure changes take effect immediately.
3. **During Focus**: Blocked sites become inaccessible in all browsers. Visual feedback and notifications keep you informed.
4. **Breaks & Completion**: When the timer ends or a break starts, the app restores your original hosts file and flushes DNS again, making all sites accessible.
5. **Emergency Access**: If something goes wrong, you can instantly restore access with the emergency button or force clean the hosts file.
6. **Crash Recovery**: If the app or system crashes, your hosts file is automatically restored on next launch.

**Note:** Some browsers may cache DNS longer; for best results, restart your browser after session changes.

---

## 🔧 Technical Details

- **Frontend**: React 19.1.0
- **Backend**: Electron 37.2.2
- **Build**: Webpack + Electron Forge
- **Storage**: electron-store
- **System Access**: sudo-prompt

### Project Structure
```
src/
├── main.js       # Electron main process
├── app.jsx       # React UI
├── index.css     # Styles
├── preload.js    # Secure IPC bridge
├── renderer.js   # Renderer entry
└── index.html    # HTML template
```

---

## 🌐 Language Support

Focus Guardian supports both **Turkish** and **English** user interfaces. You can switch the app language anytime from the settings menu.

- All UI texts, notifications, and controls are available in both languages.
- New languages can be added easily by editing the files in `src/locales/`.

**How to add a new language:**
1. Create a new JSON file in `src/locales/` (e.g. `fr.json` for French).
2. Add your translations using the same keys as `en.json` and `tr.json`.
3. Update the language selector in the app UI.

---

## 🐛 Troubleshooting

- **Admin Error**: Run as administrator if you see permission errors.
- **Blocking Not Working**: Check admin rights, antivirus, and hosts file protection.
- **App Crash**: Hosts file is auto-restored; check C:\Windows\System32\drivers\etc\hosts manually if needed.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Credits

- [Electron](https://electronjs.org/)
- [React](https://reactjs.org/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [sudo-prompt](https://github.com/jorangreef/sudo-prompt)

---

## 📞 Contact

- **Author**: atillaertas1
- **Email**: atillaertas@protonmail.com
- **GitHub**: [@atillaertas1](https://github.com/atillaertas1)
- **Issues**: [GitHub Issues](https://github.com/atillaertas1/focus-guardian/issues)

**Stay focused. Guard your time. 🛡️**
