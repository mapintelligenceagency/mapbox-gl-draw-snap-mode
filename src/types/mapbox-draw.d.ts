declare namespace MapboxDraw {
  interface DrawCustomModeThis {
    map: mapboxgl.Map;
    _ctx: any;
    setSelectedCoordinates(
      coords: { coord_path: string; feature_id: string }[]
    ): void;
    setSelected(features: string | string[]): void;
  }
  interface DrawFeature {
    updateCoordinate(number, number, number);
  }
}
