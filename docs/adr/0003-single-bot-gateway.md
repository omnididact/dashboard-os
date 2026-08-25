# One Bot gateway, not a route per Module

Bots call `/api/bot/in` and `/api/bot/out`. Payloads are typed per Module inside that gateway. A new HTTP route per Module would fork auth, identity, and errors eleven times.
