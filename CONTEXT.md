# Dashboard OS

A household wall dashboard. Bots publish information into modules. Humans look at the wall.

## Language

**Wall**:
The always-on household display (kiosk on a Pi or monitor). The audience is the household, not the bots.
_Avoid_: Screen, console, kiosk app, bot dashboard

**Companion**:
The phone UI for configuring the Wall on the LAN.
_Avoid_: Admin, mobile app, control panel

**Bot**:
A named agent that publishes into modules and reads Wall state. A Bot is not a viewer.
_Avoid_: Integration, webhook, plugin, user

**Bot token**:
A revocable secret that identifies one named Bot to the In API and Out API.
_Avoid_: API key, PIN, session, webhook secret

**Module**:
A typed tile on the Wall (weather, tasks, commute, and so on). One kind of information.
_Avoid_: Widget, card, gadget, block

**Module instance**:
A placed Module on the grid, with its own id and config. The same Module can exist more than once.
_Avoid_: Tile, widget instance

**In API**:
The Bot write surface at `/api/bot/in`. A Bot publishes a payload for a Module instance. It does not rearrange the grid unless later granted that privilege.
_Avoid_: Input API, ingest, webhook

**Out API**:
The Bot read surface at `/api/bot/out`. A Bot reads layout, Module state, and human actions already taken on the Wall.
_Avoid_: Output API, export, scrape

**Publisher**:
The Bot name shown on a Module instance after a publish.
_Avoid_: Author, source, integration

**Household module**:
A Module the whole household may see (weather, commute, family events, house needs).
_Avoid_: Shared, public, family widget

**Personal module**:
A Module only Michael may see. v1 Personal Module is weight. Hidden from family views.
_Avoid_: Private widget, secret tile, hidden module

**Report**:
A Bot-published Module: a titled write-up with a summary and a body. Not a chat log.
_Avoid_: Research, article, note, memo
