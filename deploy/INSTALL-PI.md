# Install Dashboard OS on a Raspberry Pi

The Pi runs the **whole stack** (Next.js + SQLite + APIs). Phones and the wall browser just open the Pi’s IP.

| URL | What |
|-----|------|
| `http://PI_IP:3000/` | Wall dashboard |
| `http://PI_IP:3000/companion` | Phone control |
| `http://PI_IP:3000/settings` | Settings |

---

## Easiest: `git clone` (recommended)

### Once on your Mac — put the code on GitHub (or any git host)

```bash
cd ~/Desktop/Dashboard\ OS

# if you haven't already:
git add -A
git commit -m "Dashboard OS"

# create an empty repo on GitHub (private is fine), then:
git remote add origin https://github.com/YOUR_USER/dashboard-os.git
git push -u origin main
```

### Once on the Pi — Node + tools

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 git
```

### Install + run

```bash
cd ~
git clone https://github.com/YOUR_USER/dashboard-os.git
cd dashboard-os
bash scripts/install-on-pi.sh
npm run start:pi
```

Open: `http://PI_IP:3000`

### Updates later

```bash
cd ~/dashboard-os
git pull
bash scripts/install-on-pi.sh
sudo systemctl restart dashboard-os   # if using systemd
```

---

## No GitHub? Clone straight from your Mac (LAN)

1. On the Mac: **System Settings → General → Sharing → Remote Login** (SSH) **on**
2. On the Pi:

```bash
# replace MAC_USER, MAC_IP, and path if needed
git clone "MAC_USER@MAC_IP:/Users/Apple/Desktop/Dashboard OS" ~/dashboard-os
cd ~/dashboard-os
bash scripts/install-on-pi.sh
npm run start:pi
```

Updates:

```bash
cd ~/dashboard-os && git pull && bash scripts/install-on-pi.sh
```

---

## Always-on (systemd)

```bash
cd ~/dashboard-os
sudo cp deploy/dashboard-os.service /etc/systemd/system/
# edit User= and WorkingDirectory= if your path/user differ
sudo systemctl daemon-reload
sudo systemctl enable --now dashboard-os
```

---

## Wall kiosk (Chromium)

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

---

## Optional: tarball (if you prefer not to use git)

```bash
# Mac
npm run package:pi
scp dist/dashboard-os-pi-*.tar.gz pi@PI_IP:~/

# Pi
tar -xzf dashboard-os-pi-*.tar.gz && cd dashboard-os
bash scripts/install-on-pi.sh
```
