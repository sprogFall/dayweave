import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { availableCardIds, type CardId, type CardScope } from '@/domain/cardLayout';
import { useCardLayoutStore } from '@/stores/cardLayout.store';
import { spacing, typography, useColors } from '@/theme';

import { CARD_META } from './meta';
import { CARD_REGISTRY } from './registry';

interface CardBoardProps {
  scope: CardScope;
  editing: boolean;
  /** 空态下的「添加卡片」需要先把页面切到编辑态。 */
  onRequestEdit: () => void;
}

interface AddableCardsProps {
  scope: CardScope;
  selected: readonly CardId[];
}

function AddableCards({ scope, selected }: AddableCardsProps) {
  const colors = useColors();
  const toggle = useCardLayoutStore((state) => state.toggle);
  const addable = availableCardIds(scope).filter((id) => !selected.includes(id));

  return (
    <Card style={styles.addCard}>
      <Text style={[styles.addTitle, { color: colors.text }]}>可添加的卡片</Text>

      {addable.length === 0 ? (
        <Text style={[styles.addEmpty, { color: colors.muted }]}>所有卡片都已经在页面上了。</Text>
      ) : (
        addable.map((id) => {
          const meta = CARD_META[id];
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`添加卡片 ${meta.title}`}
              onPress={() => toggle(scope, id)}
              style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <IconTile name={meta.icon} tint={meta.tint} size="sm" />
              <View style={styles.addCopy}>
                <Text style={[styles.addName, { color: colors.text }]}>{meta.title}</Text>
                <Text style={[styles.addSummary, { color: colors.muted }]}>{meta.summary}</Text>
              </View>
              <Ionicons name="add" size={18} color={colors.primary} />
            </Pressable>
          );
        })
      )}
    </Card>
  );
}

/**
 * 按用户配置渲染卡片。编辑态下每张卡片带上移 / 下移 / 移除，
 * 非编辑态只在用户把卡片删光后展示一次空态引导。
 */
export function CardBoard({ scope, editing, onRequestEdit }: CardBoardProps) {
  const colors = useColors();
  const ids = useCardLayoutStore((state) => state.layouts[scope]);
  const move = useCardLayoutStore((state) => state.move);
  const toggle = useCardLayoutStore((state) => state.toggle);

  return (
    <View style={styles.board}>
      {ids.map((id, index) => {
        const Component = CARD_REGISTRY[id];

        const edit = editing
          ? {
              canMoveUp: index > 0,
              canMoveDown: index < ids.length - 1,
              onMoveUp: () => move(scope, id, -1),
              onMoveDown: () => move(scope, id, 1),
              onRemove: () => toggle(scope, id),
            }
          : null;

        return <Component key={id} edit={edit} />;
      })}

      {editing ? <AddableCards scope={scope} selected={ids} /> : null}

      {!editing && ids.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="albums-outline" size={18} color={colors.faint} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            这个页面还没有卡片，挑几张想看的数据吧。
          </Text>
          <PrimaryButton label="添加卡片" onPress={onRequestEdit} />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: spacing.lg },
  addCard: { gap: spacing.md },
  addTitle: { fontSize: typography.label, fontWeight: '700' },
  addEmpty: { fontSize: typography.caption },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addCopy: { flex: 1, gap: 2 },
  addName: { fontSize: typography.body, fontWeight: '600' },
  addSummary: { fontSize: typography.caption, lineHeight: Math.round(typography.caption * 1.4) },
  empty: { gap: spacing.md, alignItems: 'center' },
  emptyText: { fontSize: typography.caption, textAlign: 'center' },
});
