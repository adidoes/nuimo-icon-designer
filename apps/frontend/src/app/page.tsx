"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Copy,
  Import,
  Bluetooth,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  GlyphAlignment,
  DisplayTransition,
  DisplayComposition,
  type DisplayGlyphOptions,
  type WebSocketMessage,
} from "@/types/nuimo";
import { Checkbox } from "@/components/ui/checkbox";

type GridType = boolean[][];

export default function Page() {
  const [grid, setGrid] = useState<GridType>(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(false) as boolean[]),
  );
  const [generatedArray, setGeneratedArray] = useState<string[]>([]);
  const [importString, setImportString] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [displayOptions, setDisplayOptions] = useState<DisplayGlyphOptions>({
    alignment: GlyphAlignment.Center,
    brightness: 1,
    timeoutMs: 5000,
    transition: DisplayTransition.CrossFade,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: "GET_DEVICE_STATUS" }));
    };
    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as WebSocketMessage;
      switch (data.type) {
        case "DEVICE_STATUS":
          setIsConnected(data.payload.connected);
          break;
        case "DEVICE_CONNECTED":
          setIsConnected(true);
          setIsConnecting(false);
          break;
        case "DEVICE_DISCONNECTED":
          setIsConnected(false);
          break;
        case "ERROR":
          console.error("Received error:", data.payload);
          alert(data.payload);
          setIsConnecting(false);
          break;
      }
    };
    ws.onclose = () => console.log("WebSocket disconnected");
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const toggleCell = (row: number, col: number): void => {
    setGrid((prevGrid) => {
      if (
        row < 0 ||
        row >= prevGrid.length ||
        col < 0 ||
        col >= prevGrid[0]!.length
      ) {
        return prevGrid;
      }
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row]![col] = !newGrid[row]![col];
      return newGrid;
    });
  };

  const generateStringArray = (): void => {
    const stringArray = grid.map(
      (row) => `    "${row.map((cell) => (cell ? "*" : " ")).join("")}",`,
    );
    setGeneratedArray(["[", ...stringArray, "]"]);
  };

  const translateGrid = (direction: "up" | "down" | "left" | "right"): void => {
    setGrid((prevGrid) => {
      let newGrid = prevGrid.map((row) => [...row]);
      switch (direction) {
        case "up":
          newGrid = [...newGrid.slice(1), newGrid[0]!];
          break;
        case "down":
          newGrid = [newGrid[newGrid.length - 1]!, ...newGrid.slice(0, -1)];
          break;
        case "left":
          newGrid = newGrid.map((row) => {
            const first = row.shift();
            return [...row, first!];
          });
          break;
        case "right":
          newGrid = newGrid.map((row) => {
            const last = row.pop();
            return [last!, ...row];
          });
          break;
      }
      return newGrid;
    });
  };

  const clearGrid = (): void => {
    setGrid(
      Array(9)
        .fill(null)
        .map(() => Array(9).fill(false) as boolean[]),
    );
    setGeneratedArray([]);
  };

  const copyToClipboard = (): void => {
    void navigator.clipboard.writeText(generatedArray.join("\n"));
  };

  const importGrid = (): void => {
    try {
      const importedArray = eval(importString) as string[][];

      if (
        Array.isArray(importedArray) &&
        importedArray.length === 9 &&
        importedArray.every(
          (row: unknown) => typeof row === "string" && row.length === 9,
        )
      ) {
        const newGrid: GridType = importedArray.map(
          (row: unknown) =>
            (typeof row === "string" &&
              row.split("").map((char) => char === "*")) ||
            [],
        );
        setGrid(newGrid);
        setImportString("");
      } else {
        throw new Error("Invalid import format");
      }
    } catch (error) {
      alert("Invalid import string. Please check the format and try again.");
    }
  };

  const connectToDevice = useCallback(() => {
    if (socket) {
      setIsConnecting(true);
      socket.send(JSON.stringify({ type: "CONNECT_DEVICE" }));
    }
  }, [socket]);

  const disconnectFromDevice = useCallback(() => {
    if (socket) {
      socket.send(JSON.stringify({ type: "DISCONNECT_DEVICE" }));
    }
  }, [socket]);

  const displayOnDevice = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "DISPLAY_GLYPH",
          payload: { grid, options: displayOptions },
        }),
      );
    }
  }, [socket, grid, displayOptions]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-3xl font-bold">Nuimo Icon Designer</h1>

      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Instructions:</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Click on the grid cells to create your icon design.</li>
          <li>Use the arrow buttons to shift your design.</li>
          <li>
            Connect to your Nuimo device using the &quot;Connect to Nuimo&quot;
            button.
          </li>
          <li>Adjust display options as needed.</li>
          <li>
            Click &quot;Display on Nuimo&quot; to send your design to the
            device.
          </li>
        </ol>
      </div>

      <div className="flex space-x-6">
        <div className="">
          <div className="mb-4">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`m-px h-8 w-8 cursor-pointer border border-gray-300 ${
                      cell ? "bg-black" : "bg-white"
                    }`}
                    onClick={() => toggleCell(rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mb-4 flex space-x-2">
            <Button onClick={() => translateGrid("up")} className="w-10 p-2">
              <ArrowUp size={16} />
            </Button>
            <Button onClick={() => translateGrid("down")} className="w-10 p-2">
              <ArrowDown size={16} />
            </Button>
            <Button onClick={() => translateGrid("left")} className="w-10 p-2">
              <ArrowLeft size={16} />
            </Button>
            <Button onClick={() => translateGrid("right")} className="w-10 p-2">
              <ArrowRight size={16} />
            </Button>
            <Button
              onClick={clearGrid}
              className="w-10 p-2"
              variant="destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <Button onClick={generateStringArray} className="mb-4">
            Generate Array
          </Button>
          {generatedArray.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xl font-semibold">Generated Array:</h3>
              <pre className="rounded bg-gray-100 p-4">
                {generatedArray.join("\n")}
              </pre>
              <Button onClick={copyToClipboard} className="mt-2">
                <Copy size={16} className="mr-2" /> Copy to Clipboard
              </Button>
            </div>
          )}
          <div className="mt-4">
            <h3 className="mb-2 text-xl font-semibold">Import Grid:</h3>
            <div className="flex space-x-2">
              <Input
                value={importString}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setImportString(e.target.value)
                }
                placeholder="Paste your array here"
                className="flex-grow"
              />
              <Button onClick={importGrid}>
                <Import size={16} className="mr-2" /> Import
              </Button>
            </div>
          </div>
        </div>

        <div className="w-64">
          <h3 className="mb-2 text-xl font-semibold">Nuimo Device Control:</h3>
          <div className="space-y-4">
            {!isConnected ? (
              <Button
                onClick={connectToDevice}
                disabled={isConnecting}
                className="w-full"
              >
                <Bluetooth size={16} className="mr-2" />
                {isConnecting ? "Connecting..." : "Connect to Nuimo"}
              </Button>
            ) : (
              <Button
                onClick={disconnectFromDevice}
                variant="destructive"
                className="w-full"
              >
                <Bluetooth size={16} className="mr-2" />
                Disconnect
              </Button>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Alignment
              </label>
              <Select
                value={displayOptions.alignment?.toString()}
                onValueChange={(value) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    alignment: parseInt(value) as GlyphAlignment,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GlyphAlignment)
                    .filter(([key]) => isNaN(Number(key)))
                    .map(([key, value]) => (
                      <SelectItem key={key} value={value.toString()}>
                        {key}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Brightness
              </label>
              <Slider
                value={[displayOptions.brightness ?? 1]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) =>
                  setDisplayOptions((prev) => ({ ...prev, brightness: value }))
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="invert"
                checked={Object.prototype.hasOwnProperty.call(
                  displayOptions,
                  "compositionMode",
                )}
                onCheckedChange={(checked) => {
                  setDisplayOptions((prev) => {
                    const newOptions = { ...prev };
                    if (checked) {
                      newOptions.compositionMode = DisplayComposition.Invert;
                    } else {
                      delete newOptions.compositionMode;
                    }
                    return newOptions;
                  });
                }}
              />
              <label
                htmlFor="invert"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Invert Colors
              </label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Timeout (ms)
              </label>
              <Input
                type="number"
                value={displayOptions.timeoutMs}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    timeoutMs: parseInt(e.target.value),
                  }))
                }
                min={0}
                max={25000}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Transition
              </label>
              <Select
                value={displayOptions.transition?.toString()}
                onValueChange={(value) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    transition: parseInt(value) as DisplayTransition,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transition" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DisplayTransition)
                    .filter(([key]) => isNaN(Number(key)))
                    .map(([key, value]) => (
                      <SelectItem key={key} value={value.toString()}>
                        {key}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={displayOnDevice}
              disabled={!isConnected}
              className="w-full"
            >
              <Send size={16} className="mr-2" />
              Display on Nuimo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
