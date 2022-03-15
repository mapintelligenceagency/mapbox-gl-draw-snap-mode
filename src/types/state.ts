import { DrawFeature } from "@mapbox/mapbox-gl-draw";
import { Feature, Polygon } from "geojson";
import { Map } from "mapbox-gl";

export type Coord = [number, number];
export type LngLat = { lng: number; lat: number };

export type State = {
  map: Map;
  line: DrawFeature;
  polygon: DrawFeature;
  currentVertexPosition: number;
  vertices: LngLat[];
  snapList: Feature[];
  selectedFeatures: DrawFeature[];
  verticalGuide: DrawFeature;
  horizontalGuide: DrawFeature;
  direction: "forward";
  moveendCallback?: () => void;
  optionsChangedCallBack: (_: any) => void;
  snappedLng?: number;
  snappedLat?: number;
  options: any;
  lastVertex: Coord;
  showVerticalSnapLine?: boolean;
  showHorizontalSnapLine?: boolean;
};

export type SnapOptions = any;
