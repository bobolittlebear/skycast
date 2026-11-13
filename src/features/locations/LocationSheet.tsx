import type { JSX } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import {
  borderRadius,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme/tokens';
import { LocationSheetList } from './LocationSheetList';
import { LocationSheetSearch } from './LocationSheetSearch';
import { useLocationSheet } from './useLocationSheet';

/** 面板圆角与天气卡片保持一致 */
const SHEET_RADIUS = 20;
/** 面板最大高度占屏幕的比例，避免在小屏上盖满整页 */
const SHEET_MAX_HEIGHT_RATIO = 0.6;
/** 面板最大宽度，窄屏时按屏宽收缩 */
const SHEET_MAX_WIDTH = 360;

export interface LocationSheetProps {
  /** 是否显示地点面板 */
  visible: boolean;
  /** 关闭面板；由父组件控制可见性 */
  onDismiss: () => void;
}

/**
 * 地点面板：底部居中的双视图卡片，列表与搜索在同一 Modal 内切换。
 * Snackbar 悬浮在卡片上方；关闭面板会清空搜索词与待处理的定位状态。
 */
export function LocationSheet({
  visible,
  onDismiss,
}: LocationSheetProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const sheet = useLocationSheet(onDismiss);

  const panelWidth = Math.min(SHEET_MAX_WIDTH, width - spacing.md * 2);
  const panelMaxHeight = height * SHEET_MAX_HEIGHT_RATIO;
  const isSearch = sheet.view === 'search';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={sheet.dismiss}
        overlayAccessibilityLabel={t('settings.close')}
        contentContainerStyle={[
          styles.panel,
          {
            left: (width - panelWidth) / 2,
            width: panelWidth,
            maxHeight: panelMaxHeight,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <View pointerEvents="box-none" style={styles.snackbarHost}>
          <Snackbar
            visible={sheet.message !== null}
            onDismiss={sheet.clearMessage}
            duration={Snackbar.DURATION_MEDIUM}
            style={styles.snackbar}
          >
            {sheet.message ?? ''}
          </Snackbar>
        </View>

        <View style={styles.header}>
          {isSearch ? (
            <IconButton
              icon="arrow-left"
              size={typography.fontSize.lg}
              onPress={sheet.backToList}
              accessibilityLabel={t('settings.back')}
              style={styles.headerIcon}
            />
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
          <Text variant="titleLarge" numberOfLines={1} style={styles.title}>
            {isSearch ? t('location.addLocation') : t('location.listTitle')}
          </Text>
          <IconButton
            icon="close"
            size={typography.fontSize.lg}
            onPress={sheet.dismiss}
            accessibilityLabel={t('settings.close')}
            style={styles.headerIcon}
          />
        </View>

        {isSearch ? (
          <LocationSheetSearch
            query={sheet.query}
            onChangeQuery={sheet.setQuery}
            results={sheet.results}
            isLoading={sheet.isSearching}
            hasError={sheet.hasSearchError}
            showHint={sheet.showSearchHint}
            showEmpty={sheet.showSearchEmpty}
            onAdd={sheet.addResult}
          />
        ) : (
          <LocationSheetList
            locations={sheet.locations}
            activeId={sheet.activeId}
            deviceStatus={sheet.deviceStatus}
            onUseCurrent={sheet.useCurrent}
            onSelect={sheet.selectLocation}
            onRemove={sheet.removeLocation}
            onAdd={sheet.openSearch}
            onMessage={sheet.showMessage}
          />
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: spacing.md,
    justifyContent: 'flex-start',
    padding: spacing.md,
    borderRadius: SHEET_RADIUS,
    borderWidth: 1,
  },
  snackbarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: spacing.sm,
    alignItems: 'center',
    zIndex: 1,
  },
  snackbar: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIcon: {
    // Paper 默认触控区只有 34，这里补足到最小触控尺寸
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    margin: 0,
  },
  headerPlaceholder: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  title: {
    flex: 1,
  },
});
