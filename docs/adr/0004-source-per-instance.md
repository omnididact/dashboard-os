# Live vs bot is per Module instance

Weather, commute, and quote keep their fetchers. A Bot does not overwrite a live-sourced instance. If a Bot needs a tile, it gets its own bot-sourced instance. Last-write-wins against Open-Meteo would make the household forecast untrustworthy.
