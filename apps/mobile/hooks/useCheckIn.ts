import { useCallback, useEffect, useRef, useState } from "react";

import {
  abandonCheckIn,
  completeCheckIn,
  convertCheckIn,
  getActiveCheckIn,
  respondCheckIn,
  startCheckIn,
} from "@/services/api/checkIn";
import { ApiError } from "@/services/api/errors";
import type {
  AISession,
  CheckInResponse,
  JournalEntry,
  MoodCategory,
  MoodSpecific,
  TriggerSource,
} from "@/types";

export type CheckInStep = "loading" | "mood" | "prompt" | "outcome";

interface CheckInState {
  readonly step: CheckInStep;
  readonly session: AISession | null;
  readonly promptContent: string | null;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly responseText: string;
  readonly entry: JournalEntry | null;
  readonly error: string | null;
  readonly isSubmitting: boolean;
}

export interface UseCheckInReturn {
  readonly step: CheckInStep;
  readonly session: AISession | null;
  readonly promptContent: string | null;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly responseText: string;
  readonly entry: JournalEntry | null;
  readonly error: string | null;
  readonly isSubmitting: boolean;
  readonly setMoodCategory: (category: MoodCategory) => void;
  readonly setMoodSpecific: (specific: MoodSpecific) => void;
  readonly setResponseText: (text: string) => void;
  readonly submitMood: () => void;
  readonly submitResponse: () => Promise<void>;
  readonly complete: () => Promise<void>;
  readonly convert: (journalId?: string, title?: string) => Promise<JournalEntry | null>;
  readonly abandon: () => Promise<void>;
  readonly retry: () => void;
}

const INITIAL_STATE: CheckInState = {
  step: "loading",
  session: null,
  promptContent: null,
  moodCategory: null,
  moodSpecific: null,
  responseText: "",
  entry: null,
  error: null,
  isSubmitting: false,
};

const NOT_FOUND = 404;

function resolveStepFromFlowState(flowState: Record<string, unknown>): CheckInStep {
  const step = flowState.step as string | undefined;
  if (step === "responded") return "outcome";
  if (step === "prompted") return "prompt";
  return "mood";
}

export function useCheckIn(triggerSource: TriggerSource = "manual"): UseCheckInReturn {
  const [state, setState] = useState<CheckInState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const mountedRef = useRef(true);
  const initRef = useRef(false);
  const sessionPromiseRef = useRef<Promise<CheckInResponse> | null>(null);

  const safeSetState = useCallback((updater: (prev: CheckInState) => CheckInState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  const applyResponse = useCallback(
    (response: CheckInResponse, step: CheckInStep) => {
      safeSetState((prev) => ({
        ...prev,
        step,
        session: response.session,
        promptContent: response.prompt_content ?? prev.promptContent,
        entry: response.entry ?? prev.entry,
        error: null,
        isSubmitting: false,
      }));
    },
    [safeSetState],
  );

  const handleError = useCallback(
    (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      safeSetState((prev) => ({
        ...prev,
        error: message,
        isSubmitting: false,
      }));
    },
    [safeSetState],
  );

  const ensureSession = useCallback(async (): Promise<CheckInResponse | null> => {
    if (stateRef.current.session) {
      return null;
    }
    if (sessionPromiseRef.current) {
      return sessionPromiseRef.current;
    }
    const promise = startCheckIn({ trigger_source: triggerSource });
    sessionPromiseRef.current = promise;
    try {
      const response = await promise;
      safeSetState((prev) => ({
        ...prev,
        session: response.session,
        promptContent: response.prompt_content ?? prev.promptContent,
      }));
      return response;
    } catch (err) {
      sessionPromiseRef.current = null;
      throw err;
    }
  }, [triggerSource, safeSetState]);

  const initialize = useCallback(async () => {
    try {
      const active = await getActiveCheckIn();
      const resumeStep = resolveStepFromFlowState(active.session.flow_state);

      const moodCategory = (active.session.flow_state.mood_category as MoodCategory | undefined) ?? null;
      const moodSpecific = (active.session.flow_state.mood_specific as MoodSpecific | undefined) ?? null;
      const responseText = (active.session.flow_state.response_text as string | undefined) ?? "";

      safeSetState((prev) => ({
        ...prev,
        step: resumeStep,
        session: active.session,
        promptContent: active.prompt_content,
        moodCategory,
        moodSpecific,
        responseText,
        entry: active.entry,
        error: null,
        isSubmitting: false,
      }));
    } catch (err) {
      if (err instanceof ApiError && err.status === NOT_FOUND) {
        safeSetState((prev) => ({ ...prev, step: "mood", error: null }));
        ensureSession().catch(() => {});
      } else {
        handleError(err);
      }
    }
  }, [safeSetState, handleError, ensureSession]);

  useEffect(() => {
    mountedRef.current = true;
    if (!initRef.current) {
      initRef.current = true;
      initialize();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialize]);

  const setMoodCategory = useCallback(
    (category: MoodCategory) => {
      safeSetState((prev) => ({
        ...prev,
        moodCategory: category,
        moodSpecific: null,
      }));
    },
    [safeSetState],
  );

  const setMoodSpecific = useCallback(
    (specific: MoodSpecific) => {
      safeSetState((prev) => ({ ...prev, moodSpecific: specific }));
    },
    [safeSetState],
  );

  const setResponseText = useCallback(
    (text: string) => {
      safeSetState((prev) => ({ ...prev, responseText: text }));
    },
    [safeSetState],
  );

  const submitMood = useCallback(() => {
    safeSetState((prev) => ({ ...prev, step: "prompt" }));
  }, [safeSetState]);

  const submitResponse = useCallback(async () => {
    const current = stateRef.current;
    if (!current.moodCategory) return;

    safeSetState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await ensureSession();
      const latest = stateRef.current;
      if (!latest.session) {
        throw new ApiError(0, "Session not available");
      }

      const response = await respondCheckIn(latest.session.id, {
        mood_category: current.moodCategory,
        mood_specific: current.moodSpecific ?? undefined,
        response_text: current.responseText,
      });
      applyResponse(response, "outcome");
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, applyResponse, handleError, ensureSession]);

  const complete = useCallback(async () => {
    const current = stateRef.current;
    if (!current.session) return;

    safeSetState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await completeCheckIn(current.session.id);
      applyResponse(response, "outcome");
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, applyResponse, handleError]);

  const convert = useCallback(
    async (journalId?: string, title?: string): Promise<JournalEntry | null> => {
      const current = stateRef.current;
      if (!current.session) return null;

      safeSetState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const response = await convertCheckIn(current.session.id, {
          journal_id: journalId,
          title,
        });
        applyResponse(response, "outcome");
        return response.entry;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [safeSetState, applyResponse, handleError],
  );

  const abandon = useCallback(async () => {
    const current = stateRef.current;
    if (!current.session) return;

    try {
      await abandonCheckIn(current.session.id);
    } catch {
      // best-effort
    }
  }, []);

  const retry = useCallback(() => {
    initRef.current = false;
    sessionPromiseRef.current = null;
    setState(INITIAL_STATE);
    initRef.current = true;
    initialize();
  }, [initialize]);

  return {
    step: state.step,
    session: state.session,
    promptContent: state.promptContent,
    moodCategory: state.moodCategory,
    moodSpecific: state.moodSpecific,
    responseText: state.responseText,
    entry: state.entry,
    error: state.error,
    isSubmitting: state.isSubmitting,
    setMoodCategory,
    setMoodSpecific,
    setResponseText,
    submitMood,
    submitResponse,
    complete,
    convert,
    abandon,
    retry,
  };
}
