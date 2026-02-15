import { ScrollView } from "react-native";

import { JournalPickerItem } from "./JournalPickerItem";
import { styles } from "./styles";
import type { JournalPickerProps } from "./types";

export function JournalPicker({
  journals,
  selectedId,
  onSelect,
}: JournalPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {journals.map((journal) => (
        <JournalPickerItem
          key={journal.id}
          journal={journal}
          isSelected={journal.id === selectedId}
          onPress={onSelect}
        />
      ))}
    </ScrollView>
  );
}
