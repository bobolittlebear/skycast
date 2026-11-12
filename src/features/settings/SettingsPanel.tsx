import type { ComponentProps, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { FLOATING_BUTTON_SIZE } from '../../components/ui/FloatingIconButton';
import { isLang, type Lang } from '../../i18n/language';
import { borderRadius, spacing, typography } from '../../theme/tokens';
import {
  isThemeMode,
  useSettings,
  type ThemeMode,
} from './SettingsContext';

/** 面板最大宽度，窄屏时按屏宽自适应收缩 */
const PANEL_MAX_WIDTH = 340;

/** 语言名称固定使用各自母语，不随当前界面语言翻译 */
const LANGUAGE_OPTIONS: readonly { value: Lang; label: string }[] = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'en', label: 'English' },
];

export interface SettingsPanelProps {
  visible: boolean;
  onDismiss: () => void;
}

/** 主题选项的图标，尺寸取小号以适配窄屏分段按钮 */
function renderSegmentIcon(
  name: ComponentProps<typeof MaterialCommunityIcons>['name']
): (props: { color: string }) => JSX.Element {
  function SegmentIcon({ color }: { color: string }): JSX.Element {
    return (
      <MaterialCommunityIcons
        name={name}
        color={color}
        size={typography.fontSize.sm}
      />
    );
  }

  return SegmentIcon;
}

/** 左下角弹出的设置面板：语言与主题两组选项 */
export function SettingsPanel({ visible, onDismiss }: SettingsPanelProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { lang, themeMode, setLang, setThemeMode } = useSettings();

  const panelWidth = Math.min(PANEL_MAX_WIDTH, width - spacing.md * 2);
  // 极窄屏下三个分段放不下图标 + 文案，只保留图标（无障碍标签仍在）
  const showThemeLabels = panelWidth >= 320;

  const themeButtons: {
    value: ThemeMode;
    label: string | undefined;
    icon: (props: { color: string }) => JSX.Element;
    accessibilityLabel: string;
  }[] = [
    {
      value: 'system',
      label: showThemeLabels ? t('theme.system') : undefined,
      icon: renderSegmentIcon('theme-light-dark'),
      accessibilityLabel: t('theme.system'),
    },
    {
      value: 'light',
      label: showThemeLabels ? t('theme.light') : undefined,
      icon: renderSegmentIcon('weather-sunny'),
      accessibilityLabel: t('theme.light'),
    },
    {
      value: 'dark',
      label: showThemeLabels ? t('theme.dark') : undefined,
      icon: renderSegmentIcon('weather-night'),
      accessibilityLabel: t('theme.dark'),
    },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        overlayAccessibilityLabel={t('settings.close')}
        contentContainerStyle={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            {t('settings.title')}
          </Text>
          <IconButton
            icon="close"
            size={typography.fontSize.lg}
            onPress={onDismiss}
            accessibilityLabel={t('settings.close')}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.group}>
          <Text variant="labelLarge">{t('settings.language')}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('settings.languageHint')}
          </Text>
          <SegmentedButtons<Lang>
            value={lang}
            onValueChange={(value) => {
              if (isLang(value)) {
                setLang(value);
              }
            }}
            density="small"
            buttons={LANGUAGE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              labelStyle: styles.segmentLabel,
            }))}
          />
        </View>

        <View style={styles.group}>
          <Text variant="labelLarge">{t('settings.theme')}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('settings.themeHint')}
          </Text>
          <SegmentedButtons<ThemeMode>
            value={themeMode}
            onValueChange={(value) => {
              if (isThemeMode(value)) {
                setThemeMode(value);
              }
            }}
            density="small"
            buttons={themeButtons.map((button) => ({
              ...button,
              labelStyle: styles.segmentLabel,
            }))}
          />
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: spacing.md,
    // 底边离开 FAB：按钮自身 16 的下边距 + 按钮高度 + 一段间距
    bottom: FLOATING_BUTTON_SIZE + spacing.md + spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  group: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  segmentLabel: {
    fontSize: typography.fontSize.xs,
  },
});
