export type LoadingScreenVariant = "initializing" | "loading" | "error";

export interface LoadingScreenProps {
  readonly variant: LoadingScreenVariant;
  readonly onRetry?: () => void;
}
