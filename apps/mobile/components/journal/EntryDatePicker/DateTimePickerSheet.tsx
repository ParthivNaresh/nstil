import { X, Check } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { formatDateString } from "@/lib/calendarUtils";
import { formatPickerDate, formatPickerTime } from "@/lib/dateFormatUtils";
import { radius, spacing } from "@/styles";

import { PickerCalendar } from "./PickerCalendar";
import { TimePicker } from "./TimePicker";
import type { DateTimePickerSheetProps } from "./types";

const ENTER_DURATION = 280;
const EXIT_DURATION = 200;
const MODAL_MAX_WIDTH = 340;
const CARD_INITIAL_TRANSLATE_Y = 10;

function dateToString(date: Date): string {
  return formatDateString(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function mergeDateAndTime(
  dateString: string,
  hour: number,
  minute: number,
): Date {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    hour,
    minute,
    0,
  );
}

export function DateTimePickerSheet({
  visible,
  value,
  maximumDate,
  onConfirm,
  onDismiss,
}: DateTimePickerSheetProps) {
  const { colors } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(() =>
    dateToString(value),
  );
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());

  const progress = useSharedValue(0);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const valueRef = useRef(value);
  valueRef.current = value;

  const closeModal = useCallback(() => {
    setModalVisible(false);
    dismissRef.current();
  }, []);

  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (visible && !wasVisible) {
      const current = valueRef.current;
      setNow(new Date());
      setSelectedDateStr(dateToString(current));
      setSelectedHour(current.getHours());
      setSelectedMinute(current.getMinutes());
      setModalVisible(true);

      progress.value = withTiming(1, {
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.quad),
      });
    } else if (!visible && wasVisible && modalVisible) {
      progress.value = withTiming(
        0,
        { duration: EXIT_DURATION, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(closeModal)();
          }
        },
      );
    }
  }, [visible, modalVisible, progress, closeModal]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.4,
  }));

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [
        { scale: 0.94 + 0.06 * p },
        { translateY: CARD_INITIAL_TRANSLATE_Y * (1 - p) },
      ],
    };
  });

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!modalVisible) return;

    const id = setInterval(() => {
      setNow(new Date());
    }, 10_000);

    return () => clearInterval(id);
  }, [modalVisible]);

  const todayStr = dateToString(now);
  const isToday = selectedDateStr === todayStr;
  const maxHour = isToday ? now.getHours() : undefined;
  const maxMinute = isToday ? now.getMinutes() : undefined;

  const handleDayPress = useCallback(
    (dateString: string) => {
      setSelectedDateStr(dateString);

      const isTodaySelection = dateString === dateToString(new Date());
      if (isTodaySelection) {
        const now = new Date();
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();

        setSelectedHour((prev) => {
          if (prev > nowHour) return nowHour;
          return prev;
        });
        setSelectedMinute((prev) => {
          setSelectedHour((currentHour) => {
            if (currentHour === nowHour && prev > nowMinute) {
              setSelectedMinute(nowMinute);
            }
            return currentHour;
          });
          return prev;
        });
      }
    },
    [],
  );

  const handleHourChange = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const handleMinuteChange = useCallback((minute: number) => {
    setSelectedMinute(minute);
  }, []);

  const handleConfirm = useCallback(() => {
    const merged = mergeDateAndTime(selectedDateStr, selectedHour, selectedMinute);
    const now = new Date();
    onConfirm(merged > now ? now : merged);
  }, [selectedDateStr, selectedHour, selectedMinute, onConfirm]);

  const handleBackdropPress = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const previewDate = mergeDateAndTime(
    selectedDateStr,
    selectedHour,
    selectedMinute,
  );
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
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            localStyles.card,
            {
              backgroundColor: colors.sheet,
              borderColor: colors.glassBorder,
            },
            cardStyle,
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

          <TimePicker
            hour={selectedHour}
            minute={selectedMinute}
            onHourChange={handleHourChange}
            onMinuteChange={handleMinuteChange}
            maxHour={maxHour}
            maxMinute={maxMinute}
          />

          <View style={localStyles.actions}>
            <Pressable
              onPress={onDismiss}
              style={[
                localStyles.actionButton,
                {
                  backgroundColor: withAlpha(colors.textTertiary, 0.1),
                },
              ]}
              accessibilityLabel="Cancel"
            >
              <Icon icon={X} size="sm" color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[
                localStyles.actionButton,
                {
                  backgroundColor: withAlpha(colors.accent, 0.15),
                },
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

const ACTION_SIZE = 44;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 2, MODAL_MAX_WIDTH);

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  previewRow: {
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
