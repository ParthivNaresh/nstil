import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/styles";

import type { EntryCardSkeletonProps } from "./types";

export function EntryCardSkeleton({ testID }: EntryCardSkeletonProps) {
  return (
    <Card testID={testID}>
      <View style={styles.header}>
        <Skeleton shape="circle" width={28} height={28} />
        <View style={styles.headerText}>
          <Skeleton shape="text" width="60%" height={14} />
          <Skeleton shape="text" width="30%" height={10} />
        </View>
      </View>
      <View style={styles.body}>
        <Skeleton shape="text" width="100%" height={14} />
        <Skeleton shape="text" width="80%" height={14} />
      </View>
      <View style={styles.tags}>
        <Skeleton shape="text" width={50} height={18} />
        <Skeleton shape="text" width={40} height={18} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  body: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: "row",
    gap: spacing.xs,
  },
});
