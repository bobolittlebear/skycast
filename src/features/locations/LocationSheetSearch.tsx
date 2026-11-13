import type { JSX } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Searchbar, Text, useTheme } from 'react-native-paper';
import { spacing, typography } from '../../theme/tokens';
import { LocationRow } from './LocationRow';
import type { Location } from '../../types/location';

export interface LocationSheetSearchProps {
  /** 搜索框当前输入值 */
  query: string;
  /** 输入变化时更新查询 */
  onChangeQuery: (query: string) => void;
  /** 地理编码结果 */
  results: readonly Location[];
  /** 是否正在请求 */
  isLoading: boolean;
  /** 请求是否失败 */
  hasError: boolean;
  /** 查询词不足最小长度，展示输入提示 */
  showHint: boolean;
  /** 查询完成且没有结果 */
  showEmpty: boolean;
  /** 点击结果添加地点 */
  onAdd: (location: Location) => void;
}

/**
 * 地点面板的搜索视图：自动聚焦的搜索框与结果列表。
 * 提示、加载、失败与空结果互斥展示；点击结果由上层决定添加或提示。
 */
export function LocationSheetSearch({
  query,
  onChangeQuery,
  results,
  isLoading,
  hasError,
  showHint,
  showEmpty,
  onAdd,
}: LocationSheetSearchProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <Searchbar
        placeholder={t('location.searchPlaceholder')}
        value={query}
        onChangeText={onChangeQuery}
        autoFocus
        elevation={0}
        iconColor={theme.colors.onSurfaceVariant}
        inputStyle={{ color: theme.colors.onSurface }}
        style={[
          styles.searchbar,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        accessibilityLabel={t('location.searchPlaceholder')}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showHint && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('location.searchHint')}
          </Text>
        )}

        {isLoading && (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loading}
          />
        )}

        {hasError && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.error }]}
          >
            {t('location.searchFailed')}
          </Text>
        )}

        {showEmpty && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('location.searchEmpty')}
          </Text>
        )}

        {results.map((location) => (
          <LocationRow
            key={location.id}
            location={location}
            selected={false}
            onPress={() => onAdd(location)}
            trailing={
              <View style={styles.addIcon}>
                <MaterialCommunityIcons
                  name="plus"
                  size={typography.fontSize.lg}
                  color={theme.colors.primary}
                />
              </View>
            }
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchbar: {
    marginTop: spacing.sm,
  },
  body: {
    flexShrink: 1,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  hint: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loading: {
    marginVertical: spacing.md,
  },
  addIcon: {
    width: 32,
    alignItems: 'center',
  },
});
