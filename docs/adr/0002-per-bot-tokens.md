# Bots authenticate with per-Bot tokens

The Companion PIN and the `authenticated` cookie are for humans. Bots send a revocable per-Bot token that names them. A shared secret would make one leak every Bot. The PIN is not a Bot credential.
