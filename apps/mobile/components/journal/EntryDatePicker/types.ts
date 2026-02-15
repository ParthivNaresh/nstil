export interface EntryDatePickerProps {
  readonly value: Date;
  readonly onChange: (date: Date) => void;
  readonly maximumDate?: Date;
}

export interface DateTimeTriggerProps {
  readonly value: Date;
  readonly isBackdated: boolean;
  readonly onPress: () => void;
}

export interface DateTimePickerSheetProps {
  readonly visible: boolean;
  readonly value: Date;
  readonly maximumDate?: Date;
  readonly onConfirm: (date: Date) => void;
  readonly onDismiss: () => void;
}

export interface PickerCalendarProps {
  readonly selectedDate: string;
  readonly maximumDate?: Date;
  readonly onDayPress: (dateString: string) => void;
}
