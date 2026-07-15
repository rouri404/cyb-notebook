# 5. Frontends (LVGL and Web)

## 5.1 Device Interface (ESP32 with LVGL)
- **Page Background:** pre-rendered as a bitmap (PNG converted via LVGL Image Converter) for each `paperType`.
- **Handwritten Font:** fonts like *Caveat*, *Patrick Hand* converted. Must include Portuguese accents (ã, õ, ç).
- **Fallback:** Standard font for long texts/lists.
- **Local Persistence:** JSON in LittleFS/SPIFFS acts as a cache/buffer to operate in case of a Wi-Fi drop.

## 5.2 Web Interface (React)
- **Editor:** simple textarea with Markdown preview (`react-markdown`).
- **Visuals:** Suggestive of a notebook, but clean. Punctual use of calligraphy fonts.
- **Realtime:** Maintains a persistent connection (WebSocket/SignalR) to reflect writing coming from the ESP32 instantaneously.
