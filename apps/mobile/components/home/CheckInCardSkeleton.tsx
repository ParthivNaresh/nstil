import { StyleSheet, View } from "react-native";

import { Card, Skeleton } from "@/components/ui";
import { spacing } from "@/styles";

export function CheckInCardSkeleton() {
  return (
    <Card>
      <View style={styles.container}>
        <Skeleton shape="text" width="80%" height={20} />
        <Skeleton shape="text" width="60%" height={16} />
        <View style={styles.buttonSkeleton}>
          <Skeleton shape="rect" width={120} height={40} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonSkeleton: {
    marginTop: spacing.sm,
  },
});
