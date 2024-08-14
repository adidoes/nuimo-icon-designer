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

export type WebSocketMessage =
  | DeviceStatusMessage
  | DeviceConnectedMessage
  | DeviceDisconnectedMessage
  | ErrorMessage;
