import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

import { cn } from '@/src/utils/cn';

type ButtonVariant = 'default' | 'outline' | 'ghost';

export type ButtonProps = {
  accessibilityLabel: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textClassName?: string;
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  outline: 'border border-border bg-card',
  ghost: 'bg-transparent',
};

const variantTextClassName: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-muted-foreground',
  ghost: 'text-primary',
};

export function Button({
  accessibilityLabel,
  children,
  className,
  disabled,
  leftIcon,
  onPress,
  style,
  textClassName,
  variant = 'default',
}: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cn(
        'h-[45px] flex-row items-center justify-center gap-3 rounded-md px-5 active:opacity-80',
        variantClassName[variant],
        disabled && 'opacity-50',
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      style={style}>
      {leftIcon}
      <Text className={cn('text-base font-semibold', variantTextClassName[variant], textClassName)}>
        {children}
      </Text>
    </Pressable>
  );
}
