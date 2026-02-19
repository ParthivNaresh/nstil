import { useCallback, useState } from "react";

import { DateTimePickerSheet } from "./DateTimePickerSheet";
import { DateTimeTrigger } from "./DateTimeTrigger";
import type { EntryDatePickerProps } from "./types";

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function EntryDatePicker({
  value,
  onChange,
  maximumDate,
}: EntryDatePickerProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleOpen = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleConfirm = useCallback(
    (date: Date) => {
      onChange(date);
      setSheetVisible(false);
    },
    [onChange],
  );

  return (
    <>
      <DateTimeTrigger
        value={value}
        isBackdated={!isToday(value)}
        onPress={handleOpen}
      />
      <DateTimePickerSheet
        visible={sheetVisible}
        value={value}
        maximumDate={maximumDate}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    </>
  );
}
