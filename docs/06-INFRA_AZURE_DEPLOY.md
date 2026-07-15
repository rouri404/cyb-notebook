# 6. Infrastructure and Azure Deploy

The infrastructure was designed to be maintained with minimum costs, prioritizing *serverless* approaches and on-demand consumption (ideal for personal/student use).

## 6.1 Services Used
- **Azure Container Apps:**
  - Hosts the Backend API built in Node.js.
  - Advantage: Supports scale-to-zero (scales to zero replicas when idle, generating no costs).
- **Azure Cosmos DB:**
  - NoSQL database used in the **Serverless** tier.
  - Advantage: You only pay for the RUs (Request Units) consumed, rather than paying for 24/7 provisioning.
- **Azure SignalR Service:**
  - Managed WebSocket manager.
  - Advantage: The Free Tier perfectly meets the project's needs (2 to 3 simultaneously connected clients).
- **Azure AI Vision:**
  - Used for handwritten character recognition (OCR).
  - Cost control: Debounce in the firmware is vital to not send requests on every stroke, avoiding Cognitive Services budget overruns.

## 6.2 Deploy Strategy
- The deployment pipeline must generate Docker images for the backend and web frontend.
- The web app will be served statically.
- The firmware is compiled locally via PlatformIO/ESP-IDF and physically "flashed" onto the CYD board.
