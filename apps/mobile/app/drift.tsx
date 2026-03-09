import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  DriftControls,
  DriftMoodPicker,
  DriftReadyOverlay,
  DriftScene,
  DriftTimer,
} from "@/components/drift";
import { useDrift, useDriftAudio } from "@/hooks";
import type { DriftSessionResult } from "@/lib/drift";

type ScreenStep = "ready" | "drifting" | "complete";

export default function DriftScreen() {
  const router = useRouter();
  const [screenStep, setScreenStep] = useState<ScreenStep>("ready");

  const drift = useDrift();
  useDriftAudio({ phase: drift.phase, elapsed: drift.elapsed });

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    drift.start();
    setScreenStep("drifting");
  }, [drift]);

  const handleEnd = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    drift.stop();
    setScreenStep("complete");
  }, [drift]);

  const handleMoodComplete = useCallback(
    (_result: DriftSessionResult) => {
      router.back();
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <DriftScene
        time={drift.time}
        dayProgress={drift.dayProgress}
        scrollX={drift.scrollX}
        playerY={drift.playerY}
        isTouching={drift.isTouching}
        canvasHeight={drift.canvasHeight}
      />

      {screenStep === "ready" ? (
        <DriftReadyOverlay onStart={handleStart} />
      ) : null}

      {screenStep === "drifting" ? (
        <>
          <DriftTimer elapsed={drift.elapsed} />
          <DriftControls onEnd={handleEnd} />
        </>
      ) : null}

      {screenStep === "complete" ? (
        <DriftMoodPicker
          durationSec={drift.elapsed}
          onComplete={handleMoodComplete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
