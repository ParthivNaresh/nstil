import type { SharedValue } from "react-native-reanimated";

export interface BreathingOrbProps {
  readonly phaseSignal: SharedValue<number>;
  readonly progress: SharedValue<number>;
  readonly size: number;
}
