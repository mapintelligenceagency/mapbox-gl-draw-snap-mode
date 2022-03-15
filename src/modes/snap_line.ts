import MapboxDraw, {
  DrawCustomMode,
  DrawCustomModeThis,
} from "@mapbox/mapbox-gl-draw";
import {
  geojsonTypes,
  modes,
  cursors,
  // @ts-expect-error no typings available
} from "@mapbox/mapbox-gl-draw/src/constants";
// @ts-expect-error no typings available
import doubleClickZoom from "@mapbox/mapbox-gl-draw/src/lib/double_click_zoom";
// @ts-expect-error no typings available
import DrawLine from "@mapbox/mapbox-gl-draw/src/modes/draw_line_string";
import {
  addPointToVertices,
  createSnapList,
  getGuideFeature,
  IDS,
  shouldHideGuide,
  snap,
} from "../utils";
import { State } from "../types/state";
import { Feature } from "geojson";
import { LineString } from "@turf/turf";
import { MapMouseEvent } from "mapbox-gl";

const SnapLineMode: DrawCustomMode<State> = { ...DrawLine };

SnapLineMode.onSetup = function (this: DrawCustomModeThis, options) {
  const line = this.newFeature({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: geojsonTypes.LINE_STRING,
      coordinates: [[]],
    },
  });

  const verticalGuide = this.newFeature(getGuideFeature(IDS.VERTICAL_GUIDE));
  const horizontalGuide = this.newFeature(
    getGuideFeature(IDS.HORIZONTAL_GUIDE)
  );

  this.addFeature(line);
  this.addFeature(verticalGuide);
  this.addFeature(horizontalGuide);

  const selectedFeatures = this.getSelected();
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);

  const { snapList, vertices } = createSnapList(this.map, this._ctx.api, line);

  const state: State = {
    map: this.map,
    line,
    currentVertexPosition: 0,
    vertices,
    snapList,
    selectedFeatures,
    verticalGuide,
    horizontalGuide,
    direction: "forward", // expected by DrawLineString
  };

  state.options = this._ctx.options;

  const moveendCallback = () => {
    const { snapList, vertices } = createSnapList(
      this.map,
      this._ctx.api,
      line
    );
    state.vertices = vertices;
    state.snapList = snapList;
  };
  // for removing listener later on close
  state.moveendCallback = moveendCallback;

  const optionsChangedCallBack = (options: State["options"]) => {
    state.options = options;
  };
  // for removing listener later on close
  state.optionsChangedCallBack = optionsChangedCallBack;

  this.map.on("moveend", moveendCallback);
  this.map.on("draw.snap.options_changed", optionsChangedCallBack);

  return state;
};

SnapLineMode.onClick = function (state) {
  // We save some processing by rounding on click, not mousemove
  const lng = state.snappedLng;
  const lat = state.snappedLat;

  if (!lng || !lat) {
    return;
  }

  // End the drawing if this click is on the previous position
  // Note: not bothering with 'direction'
  if (state.currentVertexPosition > 0) {
    const lastVertex = state.line.coordinates[state.currentVertexPosition - 1];

    state.lastVertex = lastVertex;

    if (lastVertex[0] === lng && lastVertex[1] === lat) {
      return this.changeMode(modes.SIMPLE_SELECT, {
        featureIds: [state.line.id],
      });
    }
  }

  // const point = state.map.project({ lng: lng, lat: lat });

  addPointToVertices(state.map, state.vertices, { lng, lat }, false);

  state.line.updateCoordinate(state.currentVertexPosition, lng, lat);

  state.currentVertexPosition++;

  state.line.updateCoordinate(state.currentVertexPosition, lng, lat);
};

SnapLineMode.onMouseMove = function (state, e) {
  const { lng, lat } = snap(state, e as unknown as MapMouseEvent);

  state.line.updateCoordinate(state.currentVertexPosition, lng, lat);
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

// This is 'extending' DrawLine.toDisplayFeatures
SnapLineMode.toDisplayFeatures = function (state, geojson, display) {
  if (shouldHideGuide(state, geojson as Feature)) return;

  // This relies on the the state of SnapLineMode being similar to DrawLine
  DrawLine.toDisplayFeatures(state, geojson, display);
};

// This is 'extending' DrawLine.onStop
SnapLineMode.onStop = function (state) {
  this.deleteFeature(IDS.VERTICAL_GUIDE, { silent: true });
  this.deleteFeature(IDS.HORIZONTAL_GUIDE, { silent: true });

  // remove moveemd callback
  if (state.moveendCallback) this.map.off("moveend", state.moveendCallback);

  // This relies on the the state of SnapLineMode being similar to DrawLine
  DrawLine.onStop.call(this, state);
};

export default SnapLineMode;
