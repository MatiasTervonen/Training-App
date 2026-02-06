declare module "react-map-gl/mapbox" {
  import * as React from "react";

  export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
    padding?: { top: number; bottom: number; left: number; right: number };
  }

  export interface MapEvent {
    target: {
      getContainer: () => HTMLElement;
    };
  }

  export interface MapProps {
    mapboxAccessToken?: string;
    mapStyle?: string;
    style?: React.CSSProperties;
    initialViewState?: Partial<ViewState> & {
      bounds?: [[number, number], [number, number]];
      fitBoundsOptions?: {
        padding?: number | { top: number; bottom: number; left: number; right: number };
      };
    };
    attributionControl?: boolean;
    onLoad?: (event: MapEvent) => void;
    children?: React.ReactNode;
  }

  export interface SourceProps {
    id: string;
    type: "geojson" | "vector" | "raster" | "image";
    data?: object;
    children?: React.ReactNode;
  }

  export interface LayerProps {
    id: string;
    type: "line" | "fill" | "circle" | "symbol" | "raster" | "background";
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    beforeId?: string;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?:
      | "center"
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right";
    children?: React.ReactNode;
  }

  export const Map: React.FC<MapProps>;
  export const Source: React.FC<SourceProps>;
  export const Layer: React.FC<LayerProps>;
  export const Marker: React.FC<MarkerProps>;

  export default Map;
}
