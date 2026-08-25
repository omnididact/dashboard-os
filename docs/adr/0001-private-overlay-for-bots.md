# Bots reach the Wall over a private overlay

The Wall stays off the public internet. Bots are not on the house LAN, so “local-first” is not enough. We use a private overlay (Tailscale or equivalent) so named Bots can call the In API and Out API without exposing household, weight, or money data as a public URL.
