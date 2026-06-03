export type InputProps = {
  value?: string;
};

export function Input({ value }: InputProps) {
  return value ?? null;
}
