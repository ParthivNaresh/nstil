import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

export interface CanvasSize {
  readonly width: number;
  readonly height: number;
}

export interface UseCanvasSizeReturn {
  readonly size: CanvasSize;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly hasSize: boolean;
}

const INITIAL_SIZE: CanvasSize = { width: 0, height: 0 };

export function useCanvasSize(): UseCanvasSizeReturn {
  const [size, setSize] = useState<CanvasSize>(INITIAL_SIZE);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const hasSize = size.width > 0 && size.height > 0;

  return { size, onLayout, hasSize };
}
