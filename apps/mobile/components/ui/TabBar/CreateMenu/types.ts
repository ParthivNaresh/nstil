export interface CreateMenuProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onNewEntry: () => void;
  readonly onNewJournal: () => void;
  readonly anchorY: number;
}
