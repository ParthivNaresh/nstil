import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/styles";

import type { EntryCardSkeletonProps } from "./types";

export function EntryCardSkeleton({ testID }: EntryCardSkeletonProps) {
  return (
    <Card testID={testID}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Skeleton shape="text" width="25%" height={10} />
          <Skeleton shape="circle" width={20} height={20} />
        </View>
        <Skeleton shape="text" width="65%" height={14} />
        <View style={styles.body}>
          <Skeleton shape="text" width="100%" height={14} />
          <Skeleton shape="text" width="75%" height={14} />
        </View>
        <View style={styles.tags}>
          <Skeleton shape="text" width={52} height={20} />
          <Skeleton shape="text" width={44} height={20} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inner: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    gap: spacing.xs,
  },
  tags: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
