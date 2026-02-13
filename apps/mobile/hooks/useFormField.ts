import { useCallback, useState } from "react";

interface FormFieldState {
  value: string;
  error: string | undefined;
  onChange: (text: string) => void;
  setError: (error: string | undefined) => void;
  reset: () => void;
}

export function useFormField(initialValue = ""): FormFieldState {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);

  const onChange = useCallback((text: string) => {
    setValue(text);
    setError(undefined);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
  }, [initialValue]);

  return { value, error, onChange, setError, reset };
}
