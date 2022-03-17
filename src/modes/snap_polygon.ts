import { DrawCustomMode, DrawFeature } from "@mapbox/mapbox-gl-draw";
import {
  geojsonTypes,
  modes,
  cursors,
  // @ts-expect-error No typings available
} from "@mapbox/mapbox-gl-draw/src/constants";
// @ts-expect-error No typings available
import doubleClickZoom from "@mapbox/mapbox-gl-draw/src/lib/double_click_zoom";
// @ts-expect-error No typings available
import DrawPolygon from "@mapbox/mapbox-gl-draw/src/modes/draw_polygon";
import { Feature, Polygon } from "geojson";
import { MapMouseEvent } from "mapbox-gl";
import { Coord, Options, State } from "../utils/state";
import {
  addPointToVertices,
  createSnapList,
  getGuideFeature,
  IDS,
  shouldHideGuide,
  snap,
} from "../utils";

const SnapPolygonMode: DrawCustomMode<State, Options> = { ...DrawPolygon };

SnapPolygonMode.onSetup = function (options) {
  const polygon = this.newFeature({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: geojsonTypes.POLYGON,
      coordinates: [[]],
    },
  }) as DrawFeature & Feature<Polygon>;

  const verticalGuide = this.newFeature(getGuideFeature(IDS.VERTICAL_GUIDE));
  const horizontalGuide = this.newFeature(
    getGuideFeature(IDS.HORIZONTAL_GUIDE)
  );

  this.addFeature(polygon);
  this.addFeature(verticalGuide);
  this.addFeature(horizontalGuide);

  const selectedFeatures = this.getSelected();
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);

  const { snapList, vertices } = createSnapList(
    this.map,
    this._ctx.api,
    polygon
  );

  const optionsChangedCallback = (options: Options) => {
    state.options = options;
  };

  const moveEndCallback = () => {
    const { snapList, vertices } = createSnapList(
      this.map,
      this._ctx.api,
      polygon
    );
    state.vertices = vertices;
    state.snapList = snapList;
  };

  const state: State = {
    map: this.map,
    polygon,
    currentVertexPosition: 0,
    vertices,
    snapList,
    selectedFeatures,
    verticalGuide,
    horizontalGuide,
    options: this._ctx.options,
    optionsChangedCallback,
    moveEndCallback,
  };

  this.map.on("moveend", moveEndCallback);
  this.map.on("draw.snap.options_changed", optionsChangedCallback);

  return state;
};

SnapPolygonMode.onClick = function (state) {
  // We save some processing by rounding on click, not mousemove
  const lng = state.snappedLng;
  const lat = state.snappedLat;

  if (!lng || !lat) {
    return;
  }
  // End the drawing if this click is on the previous position
  if (state.currentVertexPosition > 0) {
    const lastVertex =
      state.polygon?.coordinates[0][state.currentVertexPosition - 1];
    state.lastVertex = lastVertex as Coord;

    if (lastVertex[0] === lng && lastVertex[1] === lat) {
      return this.changeMode(modes.SIMPLE_SELECT, {
        featureIds: [state.polygon?.id],
      });
    }
  }

  // const point = state.map.project();

  addPointToVertices(state.map, state.vertices, [lng, lat]);

  state.polygon?.updateCoordinate(`0.${state.currentVertexPosition}`, lng, lat);

  state.currentVertexPosition++;

  state.polygon?.updateCoordinate(`0.${state.currentVertexPosition}`, lng, lat);
};

SnapPolygonMode.onMouseMove = function (state, e) {
  const { lng, lat } = snap(state, e as unknown as MapMouseEvent);

  state.polygon?.updateCoordinate(`0.${state.currentVertexPosition}`, lng, lat);
  state.snappedLng = lng;
  state.snappedLat = lat;

  if (
    state.lastVertex &&
    state.lastVertex[0] === lng &&
    state.lastVertex[1] === lat
  ) {
    this.updateUIClasses({ mouse: cursors.POINTER });

    // cursor options:
    // ADD: "add"
    // DRAG: "drag"
    // MOVE: "move"
    // NONE: "none"
    // POINTER: "pointer"
  } else {
    this.updateUIClasses({ mouse: cursors.ADD });
  }
};

// This is 'extending' DrawPolygon.toDisplayFeatures
SnapPolygonMode.toDisplayFeatures = function (state, geojson, display) {
  if (shouldHideGuide(state, geojson as Feature)) return;

  // This relies on the the state of SnapPolygonMode being similar to DrawPolygon
  DrawPolygon.toDisplayFeatures(state, geojson, display);
};

// This is 'extending' DrawPolygon.onStop
SnapPolygonMode.onStop = function (state) {
  this.deleteFeature(IDS.VERTICAL_GUIDE, { silent: true });
  this.deleteFeature(IDS.HORIZONTAL_GUIDE, { silent: true });

  // remove moveemd callback
  this.map.off("moveend", state.moveEndCallback);
  this.map.off("draw.snap.options_changed", state.optionsChangedCallback);

  // This relies on the the state of SnapPolygonMode being similar to DrawPolygon
  DrawPolygon.onStop.call(this, state);
};

export default SnapPolygonMode;
