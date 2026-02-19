import { Pressable, StyleSheet } from "react-native";
import { ImagePlus } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/styles";

import { THUMBNAIL_SIZE } from "./ImageThumbnail";

const ICON_SIZE = 22;

interface AddImageButtonProps {
  readonly onPress: () => void;
  readonly compact: boolean;
}

export function AddImageButton({ onPress, compact }: AddImageButtonProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.compactButton,
          { borderColor: colors.border },
        ]}
      >
        <ImagePlus size={ICON_SIZE} color={colors.textTertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fullWidthButton,
        { borderColor: colors.border },
      ]}
    >
      <ImagePlus size={ICON_SIZE} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidthButton: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  compactButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
