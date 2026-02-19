import { Dimensions, StyleSheet } from "react-native";

import { spacing } from "@/styles";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HORIZONTAL_PADDING = spacing.md * 2;
const CARD_INTERNAL_PADDING = spacing.md * 2;
const CARD_BORDER = 2;
const AVAILABLE_WIDTH = SCREEN_WIDTH - SCREEN_HORIZONTAL_PADDING - CARD_INTERNAL_PADDING - CARD_BORDER;
const COLUMNS = 7;
const COLUMN_WIDTH = Math.floor(AVAILABLE_WIDTH / COLUMNS);
export const CELL_SIZE = COLUMN_WIDTH - 6;
const CELL_RADIUS = CELL_SIZE / 2;

export const ROW_HEIGHT = COLUMN_WIDTH;
export const VISIBLE_ROWS = 4;
export const SCROLL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

export const DOT_SIZE = 4;

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerCenter: {
    alignItems: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: spacing.xs,
  },
  weekdayCell: {
    width: COLUMN_WIDTH,
    alignItems: "center",
  },
  scrollContainer: {
    height: SCROLL_HEIGHT,
    overflow: "hidden",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  dayCellOuter: {
    width: COLUMN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CELL_RADIUS,
  },
  dayCellBorder: {
    borderWidth: 1,
  },
  dayCellTodayRing: {
    borderWidth: 1.5,
  },
  entryDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
