# CYD Notebook (ESP32 Cheap Yellow Display)

This project is a Notebook application focused on running on an **ESP32 Cheap Yellow Display (CYD)** with an LVGL interface, accompanied by a rich **Web Frontend** (React/Vite) and an **API Backend** (Bun/Node).

## Project Structure

The repository is divided into 3 main components:

*   **[`web/`](./web/)**: Web Frontend (React + Vite + TailwindCSS). An interface that extremely faithfully simulates the ESP32 screen and the experience of a physical notebook.
*   **[`backend/`](./backend/)**: API and server (Bun/Express). Responsible for serving database data (in-memory mock or persistent database).
*   **[`firmware/`](./firmware/)**: Firmware for the ESP32 CYD board. Uses the LVGL library to render the final interface on the low-cost display.

## Dependencies

### Web & Backend
To run the Web interface and the Backend, you will need **Node.js** (or **Bun**) installed. This project uses `pnpm` and Turborepo.

### Firmware (ESP32)
For the firmware, it is recommended to use the **PlatformIO** extension in VS Code or the **ESP-IDF** framework.

## How to run (Local Development)

To run the Backend and Web Frontend simultaneously in development mode:

```bash
pnpm install
pnpm run dev
```

The Web interface will be available at `http://localhost:5173`.