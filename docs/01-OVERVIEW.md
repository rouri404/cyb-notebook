# 1. Overview

A digital notebook running on a 7" touch screen with an ESP32, where the user can write with their finger or a capacitive stylus. The handwritten text is recognized via OCR in the cloud and converted into Markdown list items. The same content can be edited through a web interface (React).

The project philosophy is **"thin client, cloud brain"**: the ESP32 only handles touch capture, LVGL rendering, and display — practically all business logic (persistence, OCR, synchronization) lives in Azure.

## 1.1 Objectives
- Handwrite tasks on a 7" screen and have the text automatically recognized.
- Edit the same tasks via a simple web interface, in Markdown.
- Keep both sides synchronized in real-time.
- Persist data simply (JSON/NoSQL), just enough to survive device reboots.
- Device visuals reminiscent of a notebook (paper background, handwritten font, configurable text color).

## 1.2 Out of scope (for now)
- Multiple users / multiple simultaneous devices.
- Offline ink recognition on the ESP32 itself (unfeasible on this hardware).
- Advanced Markdown editor (full WYSIWYG) on the web.
