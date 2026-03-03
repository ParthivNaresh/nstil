import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const SCREEN_CENTER_X = SCREEN_WIDTH / 2;
export const BACKDROP_OPACITY = 0.5;

export const OUTER_RADIUS = 120;
export const INNER_RADIUS = 26;
export const ARC_START_DEG = 180;
export const ARC_SWEEP_DEG = 180;
export const CANVAS_SIZE = OUTER_RADIUS * 2;

export const ITEM_ICON_SIZE = 22;
export const ITEM_ICON_STROKE = 2;
export const ITEM_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2;
