import { Lightbulb } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, ScreenContainer } from "@/components/ui";

export default function InsightsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer centered>
      <EmptyState
        icon={Lightbulb}
        title={t("insights.emptyTitle")}
        subtitle={t("insights.emptySubtitle")}
      />
    </ScreenContainer>
  );
}
