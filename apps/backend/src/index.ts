import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  DeviceDiscoveryManager,
  NuimoControlDevice,
  Glyph,
} from "rocket-nuimo";

const server = http.createServer();
const wss = new WebSocketServer({ server });

let nuimoDevice: NuimoControlDevice | null = null;

interface WebSocketMessage {
  type: string;
  payload?: any;
}

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", async (message: string) => {
    const data: WebSocketMessage = JSON.parse(message);

    switch (data.type) {
      case "GET_DEVICE_STATUS":
        ws.send(
          JSON.stringify({
            type: "DEVICE_STATUS",
            payload: { connected: nuimoDevice !== null },
          })
        );
        break;

      case "CONNECT_DEVICE":
        if (nuimoDevice) {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              payload: "Already connected to a device",
            })
          );
        } else {
          try {
            const discoveryManager = DeviceDiscoveryManager.defaultManager;
            const session = discoveryManager.startDiscoverySession();
            const discoveredDevice = await session.waitForFirstDevice();
            await discoveredDevice.connect();
            nuimoDevice = discoveredDevice;

            nuimoDevice.on("disconnect", () => {
              broadcast({ type: "DEVICE_DISCONNECTED" });
              nuimoDevice = null;
            });

            nuimoDevice.on("batteryLevel", (level) => {
              broadcast({ type: "BATTERY_LEVEL", payload: level });
            });

            nuimoDevice.on("rssi", (rssi) => {
              broadcast({ type: "SIGNAL_STRENGTH", payload: rssi });
            });

            nuimoDevice.on("swipe", (direction) => {
              broadcast({ type: "SWIPE", payload: direction });
            });

            nuimoDevice.on("touch", (area) => {
              broadcast({ type: "TOUCH", payload: area });
            });

            nuimoDevice.on("rotate", (delta, rotation) => {
              broadcast({ type: "ROTATE", payload: { delta, rotation } });
            });

            nuimoDevice.on("hover", (proximity) => {
              broadcast({ type: "HOVER", payload: proximity });
            });

            broadcast({ type: "DEVICE_CONNECTED" });
          } catch (error) {
            console.error("Failed to connect:", error);
            ws.send(
              JSON.stringify({
                type: "ERROR",
                payload: "Failed to connect to Nuimo device",
              })
            );
          }
        }
        break;

      case "DISCONNECT_DEVICE":
        if (!nuimoDevice) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "No device connected" })
          );
        } else {
          nuimoDevice.disconnect();
          nuimoDevice = null;
          broadcast({ type: "DEVICE_DISCONNECTED" });
        }
        break;

      case "DISPLAY_GLYPH":
        if (!nuimoDevice) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "No device connected" })
          );
        } else {
          const { grid, options } = data.payload;
          if (!grid || !Array.isArray(grid) || grid.length !== 9) {
            ws.send(
              JSON.stringify({ type: "ERROR", payload: "Invalid grid data" })
            );
          } else {
            try {
              const glyphString = grid
                .map((row: boolean[]) =>
                  row.map((cell) => (cell ? "*" : " ")).join("")
                )
                .join("\n");
              const glyph = Glyph.fromString(glyphString.split("\n"));
              await nuimoDevice.displayGlyph(glyph, options);
              ws.send(JSON.stringify({ type: "GLYPH_DISPLAYED" }));
            } catch (error) {
              console.error("Failed to display glyph:", error);
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  payload: "Failed to display glyph on Nuimo device",
                })
              );
            }
          }
        }
        break;

      default:
        ws.send(
          JSON.stringify({ type: "ERROR", payload: "Unknown message type" })
        );
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});

function broadcast(message: WebSocketMessage): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
