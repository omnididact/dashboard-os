# Dashboard OS

Modular, local-first household dashboard for **vertical wall monitors** and **Raspberry Pi** kiosks (including **2GB** models). Configure from a phone on your LAN.

## Features

- Modular grid (drag/resize when editing)
- **Light & dark mode** (header sun/moon, Settings, Companion — saved on the Pi)
- **View modes** — Board · Family · Weather · Commute · Tasks & Needs
- Modules: **Family Events**, **Weather**, **Commute + leave-by**, **Tasks**, **House Needs**
- Quote of the day in the header
- Mobile companion at `/companion`
- **Siri / Shortcuts** via `/api/view` (no native HomeKit app required)
- **Performance mode** on by default (Pi-safe: no glass blur)
- Local SQLite storage

## Wall view modes

| Control | Action |
|---------|--------|
| Header ◀ ▶ | Cycle views |
| `←` `→` | Previous / next view |
| `0` or `B` | Full board |
| `1`–`n` | Jump to mode by index |
| `Esc` | Exit module focus → board (then exit kiosk fullscreen) |
| URL | `http://pi:3000/?view=events` |

### Hey Siri (Apple Shortcuts)

Siri does **not** talk to the Pi natively. Use a **Shortcut** that hits the wall API (works great on LAN).

1. On iPhone, open **Shortcuts → + → Add Action → Web → Get Contents of URL**
2. URL (replace IP):

```text
http://192.168.1.19:3000/api/view?view=calendar
```

3. Method: **GET** (this sets the wall view and can redirect)
4. Name the shortcut e.g. **“Dashboard calendar”**
5. Add to Siri: “Switch dashboard to calendar”

**Aliases:** `calendar` / `family` / `events` · `weather` · `commute` · `tasks` / `todo` · `needs` / `shopping` · `board` / `home`

JSON control (optional, no redirect):

```bash
curl -X POST http://PI_IP:3000/api/view \
  -H 'Content-Type: application/json' \
  -d '{"view":"events"}'
```

The wall polls settings every ~15s, so Siri changes appear shortly (or open `/?view=events` for instant).

**Apple Home:** there is no built-in HomeKit bridge in-app. Options:

- Siri Shortcuts only (recommended)
- [Homebridge](https://homebridge.io) HTTP switch → same `/api/view` URL
- Home Assistant RESTful command → same endpoint

## Quick start (development)

**Node.js 20+** (22 LTS recommended)

```bash
cd ~/Desktop/Dashboard\ OS
npm install
npm run dev:lan
```

| URL | Purpose |
|-----|---------|
| `/` | Wall display (kiosk) |
| `/companion` | Phone control |
| `/settings` | Appearance, PIN, performance |

## Production (desktop / always-on PC)

```bash
npm run build
npm run start:lan
```

## Host everything on a Raspberry Pi

The Pi runs the **whole stack**. Phones and the wall browser just open the Pi’s IP.

**Full guide:** [`deploy/INSTALL-PI.md`](deploy/INSTALL-PI.md)

### Easiest: git clone

**1. On your Mac** — push once to GitHub (private repo is fine):

```bash
cd ~/Desktop/Dashboard\ OS
git remote add origin https://github.com/YOUR_USER/dashboard-os.git
git push -u origin main
```

**2. On the Pi** (one-time Node install, then clone):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 git

git clone https://github.com/YOUR_USER/dashboard-os.git
cd dashboard-os
bash scripts/install-on-pi.sh
npm run start:pi
```

**Updates forever after:**

```bash
cd ~/dashboard-os && git pull && bash scripts/install-on-pi.sh
```

No GitHub? Clone over your home network from the Mac (SSH Remote Login on):

```bash
git clone "YOU@MAC_IP:/Users/Apple/Desktop/Dashboard OS" ~/dashboard-os
```

| URL | Purpose |
|-----|---------|
| `http://PI_IP:3000/` | Wall dashboard |
| `http://PI_IP:3000/companion` | Phone UI |
| `http://PI_IP:3000/settings` | Settings |

### Always-on + kiosk

```bash
sudo cp deploy/dashboard-os.service /etc/systemd/system/
sudo systemctl enable --now dashboard-os
```

Chromium kiosk: see [`deploy/INSTALL-PI.md`](deploy/INSTALL-PI.md).

## Project layout

```text
src/
  app/                 # Next.js routes + API
  components/dashboard # Grid shell, kiosk chrome
  modules/             # weather | commute | events | tasks | needs | quote
  lib/db               # SQLite
scripts/pi-start.sh    # Pi production launcher
deploy/                # systemd unit
data/                  # dashboard.db (gitignored)
```

## APIs

| Endpoint | Purpose |
|----------|---------|
| `GET/PUT /api/layout` | Modules + grid |
| `GET /api/weather` | Open-Meteo (cached) |
| `POST /api/commute` | OSRM typical drive times (cached) |
| `GET/POST /api/tasks` | Tasks CRUD |
| `GET/POST /api/needs` | House needs CRUD |
| `GET /api/quote` | Daily quote (cached) |
| `GET/POST /api/settings` | Settings + PIN |

## License

Private / personal use unless you choose otherwise.
