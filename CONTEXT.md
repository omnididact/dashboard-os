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
A revocable secret that identifies one named Bot to the In API and Out API. Minted only in the Companion. Scoped to Module types on both In and Out.
_Avoid_: API key, PIN, session, webhook secret

**Module**:
A typed tile on the Wall (weather, tasks, commute, and so on). One kind of information.
_Avoid_: Widget, card, gadget, block

**Module instance**:
A placed Module on the grid, with its own id and config. The same Module can exist more than once.
_Avoid_: Tile, widget instance

**Place**:
The human action of putting a Module instance on the grid in edit mode. A Bot cannot Place.
_Avoid_: Spawn, add, provision

**Live-sourced**:
A Module instance whose data comes from a fetcher (weather, commute, quote).
_Avoid_: Auto, system, default source

**Bot-sourced**:
A Module instance whose data is the last In API payload for that instance.
_Avoid_: Manual, override, injected

**In API**:
The Bot write surface at `/api/bot/in`. A Bot publishes a payload to an existing Module instance. No instance of that type, the publish fails. It does not rearrange the grid.
_Avoid_: Input API, ingest, webhook

**Out API**:
The Bot read surface at `/api/bot/out`. A snapshot of layout, Module state, and human actions already taken on the Wall, filtered to the token’s Module types. Not an event log.
_Avoid_: Output API, export, scrape, stream

**Publisher**:
The Bot name shown on a Module instance after a publish.
_Avoid_: Author, source, integration

**Household module**:
A Module the whole household may see (weather, commute, family events, house needs).
_Avoid_: Shared, public, family widget

**Personal module**:
A Module only Michael may see. v1 Personal Module is weight. Never shown in family views. If the PIN is unset, it renders nowhere.
_Avoid_: Private widget, secret tile, hidden module

**Me view**:
The PIN-gated Wall view that may show Personal modules.
_Avoid_: Private view, Michael mode, secret board

**Report**:
A Bot-published Module: title, summary, markdown body, optional link, published time, Publisher. The tile shows the latest plus a short history.
_Avoid_: Research, article, note, memo

**Weight entry**:
One number, a unit, a date, and an optional note. The Module shows recent entries as a sparkline.
_Avoid_: Weigh-in, measurement, sample
