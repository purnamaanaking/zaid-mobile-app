import { Colors } from '@/src/constants/colors';
import { Radius, Spacing } from '@/src/constants/spacing';
import { TextStyles } from '@/src/constants/typography';

export const Theme = {
  colors: Colors,
  radius: Radius,
  spacing: Spacing,
  text: TextStyles,
} as const;
