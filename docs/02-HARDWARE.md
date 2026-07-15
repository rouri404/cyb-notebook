# 2. Hardware and Devices

| Item | Choice | Notes |
|---|---|---|
| Board | Sunton **ESP32-8048S070C** ("CYD" 7") | The "C" suffix indicates the **touch** version — do not confuse with the non-touch variant |
| MCU | ESP32-S3, dual-core | 8MB PSRAM, 16MB Flash |
| Display | 7", 800×480, parallel RGB (EK9716 driver) | Not SPI — different LVGL driver from the 2.8" CYDs |
| Touch | Capacitive, GT911 (I2C) | See hardware note below |
| Pen | Fine-tip capacitive stylus (tablet type) | No pressure/tilt support like a resistive stylus |
| Audio | MAX98357 amplifier (I2S) | Not used in the MVP |

## 2.1 Hardware Note — Mandatory Mod
By default, this board **does not connect the GT911's INT pin** to any GPIO, forcing the firmware to constantly *poll* the touch panel — which generates **>80% CPU usage** even when the screen is idle. There is a hardware fix (soldering a 0Ω resistor in a specific position on the board, freeing GPIO18) that reduces this usage to **<10% on average**. This modification must be done before any serious UI performance testing.
