import { useAppTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const { isDark } = useAppTheme();
  return isDark ? Colors.dark : Colors.light;
}
