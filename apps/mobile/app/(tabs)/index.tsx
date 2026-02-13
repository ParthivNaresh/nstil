import { BookOpen } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, ScreenContainer } from "@/components/ui";

export default function JournalScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer centered>
      <EmptyState
        icon={BookOpen}
        title={t("journal.emptyTitle")}
        subtitle={t("journal.emptySubtitle")}
      />
    </ScreenContainer>
  );
}
