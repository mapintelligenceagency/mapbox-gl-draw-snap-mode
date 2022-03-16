import { DrawFeature } from "@mapbox/mapbox-gl-draw";
import { Feature, Polygon, LineString, Point } from "geojson";
import { Map } from "mapbox-gl";

export type Coord = [lng: number, lat: number];
export type LngLat = { lng: number; lat: number };

export type Options = {
  snap: boolean;
  guides: boolean;
  snapOptions: {
    snapVertexPriorityDistance: number;
    snapPx: number;
    snapToMidPoints: boolean;
  };
};

export type State = {
  map: Map;
  point?: DrawFeature;
  line?: DrawFeature;
  polygon?: DrawFeature;
  currentVertexPosition: number;
  vertices: Coord[];
  snapList: Feature[];
  selectedFeatures: DrawFeature[];
  verticalGuide: DrawFeature;
  horizontalGuide: DrawFeature;
  direction?: "forward";
  moveEndCallback: (...args: any[]) => void;
  optionsChangedCallback: (options: Options) => void;
  snappedLng?: number;
  snappedLat?: number;
  options: Options;
  lastVertex?: Coord;
  showVerticalSnapLine?: boolean;
  showHorizontalSnapLine?: boolean;
};
