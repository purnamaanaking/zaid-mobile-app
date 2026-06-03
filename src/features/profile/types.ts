import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

export type ProfileSetting = {
  description?: string;
  hasAlert?: boolean;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  type?: 'link' | 'toggle';
};
