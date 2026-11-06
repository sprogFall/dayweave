/** 编辑态下挂在卡片标题右侧的操作；正常态为 null。 */
export interface CardEditActions {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/** 所有可注册卡片统一的入参，保证新增卡片不需要改动容器。 */
export interface CardViewProps {
  edit: CardEditActions | null;
}
