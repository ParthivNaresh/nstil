import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X, Check } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { formatDateString } from "@/lib/calendarUtils";
import { formatPickerDate, formatPickerTime } from "@/lib/dateFormatUtils";
import { radius, spacing } from "@/styles";

import { PickerCalendar } from "./PickerCalendar";
import type { DateTimePickerSheetProps } from "./types";

const ENTER_DURATION = 300;
const EXIT_DURATION = 200;

function dateToString(date: Date): string {
  return formatDateString(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function mergeDateAndTime(dateString: string, time: Date): Date {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
  );
}

export function DateTimePickerSheet({
  visible,
  value,
  maximumDate,
  onConfirm,
  onDismiss,
}: DateTimePickerSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(() => dateToString(value));
  const [selectedTime, setSelectedTime] = useState(value);
  const [timeKey, setTimeKey] = useState(0);

  const opacity = useSharedValue(0);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const closeModal = useCallback(() => {
    setModalVisible(false);
    dismissRef.current();
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedDateStr(dateToString(value));
      setSelectedTime(value);
      setTimeKey((k) => k + 1);
      setModalVisible(true);
      opacity.value = withTiming(1, { duration: ENTER_DURATION });
    } else if (modalVisible) {
      opacity.value = withTiming(0, { duration: EXIT_DURATION }, (finished) => {
        if (finished) {
          runOnJS(closeModal)();
        }
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 30 }],
  }));

  const handleDayPress = useCallback((dateString: string) => {
    setSelectedDateStr(dateString);
  }, []);

  const handleTimeChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (date) {
        setSelectedTime(date);
      }
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    const merged = mergeDateAndTime(selectedDateStr, selectedTime);
    const now = new Date();
    onConfirm(merged > now ? now : merged);
  }, [selectedDateStr, selectedTime, onConfirm]);

  const isSelectedDateToday = selectedDateStr === dateToString(new Date());

  const handleBackdropPress = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const previewDate = mergeDateAndTime(selectedDateStr, selectedTime);
  const previewLabel = `${formatPickerDate(previewDate)} — ${formatPickerTime(previewDate)}`;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={localStyles.overlay}>
        <Animated.View style={[localStyles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        </Animated.View>

        <Animated.View
          style={[
            localStyles.sheet,
            {
              backgroundColor: colors.sheet,
              borderColor: colors.glassBorder,
              paddingBottom: insets.bottom + spacing.md,
            },
            sheetStyle,
          ]}
        >
          <View style={localStyles.previewRow}>
            <AppText variant="caption" color={colors.textSecondary}>
              {previewLabel}
            </AppText>
          </View>

          <PickerCalendar
            selectedDate={selectedDateStr}
            maximumDate={maximumDate}
            onDayPress={handleDayPress}
          />

          <View style={localStyles.timeSection}>
            <DateTimePicker
              key={timeKey}
              value={selectedTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              maximumDate={isSelectedDateToday ? maximumDate : undefined}
              themeVariant={isDark ? "dark" : "light"}
              accentColor={colors.accent}
              style={localStyles.timePicker}
            />
          </View>

          <View style={localStyles.actions}>
            <Pressable
              onPress={onDismiss}
              style={[
                localStyles.actionButton,
                { backgroundColor: withAlpha(colors.textTertiary, 0.1) },
              ]}
              accessibilityLabel="Cancel"
            >
              <Icon icon={X} size="sm" color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[
                localStyles.actionButton,
                { backgroundColor: withAlpha(colors.accent, 0.15) },
              ]}
              accessibilityLabel="Confirm"
            >
              <Icon icon={Check} size="sm" color={colors.accent} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const ACTION_SIZE = 48;

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  previewRow: {
    alignItems: "center",
    paddingBottom: spacing.xs,
  },
  timeSection: {
    alignItems: "center",
    height: 120,
    overflow: "hidden",
  },
  timePicker: {
    height: 120,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
