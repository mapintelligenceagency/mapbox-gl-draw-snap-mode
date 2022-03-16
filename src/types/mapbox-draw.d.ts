declare namespace MapboxDraw {
  interface DrawCustomModeThis {
    map: mapboxgl.Map;
    _ctx: any;
    setSelectedCoordinates(
      coords: { coord_path: string; feature_id: string }[]
    ): void;
    setSelected(features: string | string[]): void;
  }

  // Better interface for DrawFeature, that was defined here: https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js
  interface DrawFeature {
    ctx: any;
    properties: GeoJsonProperties;
    coordinates: Geometry["coordinates"];
    id: string;
    type: Geometry["type"];
    updateCoordinate(_: number, _: number, _: number);
  }
}
