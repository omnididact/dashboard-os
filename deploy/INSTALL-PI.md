# Install Dashboard OS on a Raspberry Pi

## 1. One-time: Node + git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 git
```

## 2. Clone + install (starts on boot)

```bash
git clone https://github.com/omnididact/dashboard-os.git
cd dashboard-os
bash scripts/install-on-pi.sh
```

That installs dependencies, builds, and **enables the background service**.

Open: `http://PI_IP:3000`  
Phone: `http://PI_IP:3000/companion`

---

## Day-to-day commands

From the project folder:

| Command | What it does |
|---------|----------------|
| `./start` | Run in the foreground |
| `./start enable` | Run in background + start on boot |
| `./start stop` | Stop background service |
| `./start restart` | Restart service |
| `./start status` | Is it running? |
| `./start logs` | Live logs |
| `./start update` | `git pull` + rebuild + restart |

---

## Wall kiosk (fullscreen browser)

```bash
sudo apt-get install -y chromium-browser unclutter
mkdir -p ~/.config/autostart
```

`~/.config/autostart/dashboard-kiosk.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Dashboard OS Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 --memory-pressure-off --max_old_space_size=128 http://localhost:3000
```
