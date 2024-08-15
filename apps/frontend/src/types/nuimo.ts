export type LogEntry = {
  timestamp: Date;
  message: string;
};

export enum GlyphAlignment {
  Center,
  Top,
  Bottom,
  Left,
  Right,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
}

export enum DisplayTransition {
  CrossFade,
  Immediate,
}

export enum DisplayComposition {
  Invert,
}

export interface DisplayGlyphOptions {
  alignment?: GlyphAlignment;
  brightness?: number;
  compositionMode?: DisplayComposition;
  timeoutMs?: number;
  transition?: DisplayTransition;
}

export interface DeviceStatusMessage {
  type: "DEVICE_STATUS";
  payload: {
    connected: boolean;
  };
}

export interface DeviceConnectedMessage {
  type: "DEVICE_CONNECTED";
}

export interface DeviceDisconnectedMessage {
  type: "DEVICE_DISCONNECTED";
}

export interface ErrorMessage {
  type: "ERROR";
  payload: string;
}

export interface BatteryLevelMessage {
  type: "BATTERY_LEVEL";
  payload: number;
}

export interface SignalStrengthMessage {
  type: "SIGNAL_STRENGTH";
  payload: number;
}

export interface SwipeMessage {
  type: "SWIPE";
  payload: string; // You might want to create an enum for swipe directions
}

export interface TouchMessage {
  type: "TOUCH";
  payload: string; // You might want to create an enum for touch areas
}

export interface RotateMessage {
  type: "ROTATE";
  payload: {
    delta: number;
    rotation: number;
  };
}

export interface HoverMessage {
  type: "HOVER";
  payload: number;
}

export type WebSocketMessage =
  | DeviceStatusMessage
  | DeviceConnectedMessage
  | DeviceDisconnectedMessage
  | ErrorMessage
  | BatteryLevelMessage
  | SignalStrengthMessage
  | SwipeMessage
  | TouchMessage
  | RotateMessage
  | HoverMessage;
