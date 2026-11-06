import {
  CARD_IDS,
  DEFAULT_CARD_IDS,
  moveCardId,
  parseSnapshot,
  readScope,
  resolveCardIds,
  sanitizeCardIds,
  toSnapshot,
  toggleCardId,
  type CardId,
} from './cardLayout';

const AVAILABLE: readonly CardId[] = [
  CARD_IDS.todayHours,
  CARD_IDS.weekSummary,
  CARD_IDS.streak,
];

describe('cardLayout', () => {
  it('drops unknown ids and duplicate entries while keeping order', () => {
    expect(
      sanitizeCardIds(['streak', 'gone', 'today-hours', 'streak'], AVAILABLE),
    ).toEqual(['streak', 'today-hours']);
  });

  it('falls back to defaults only when nothing was ever configured', () => {
    const defaults = DEFAULT_CARD_IDS.today;

    expect(resolveCardIds(undefined, AVAILABLE, defaults)).toEqual(defaults);
    expect(resolveCardIds('nope', AVAILABLE, defaults)).toEqual(defaults);
    expect(resolveCardIds([], AVAILABLE, defaults)).toEqual([]);
    expect(resolveCardIds(['streak', null, 3, 'gone'], AVAILABLE, defaults)).toEqual(['streak']);
  });

  it('removes a card that is already shown and appends new ones', () => {
    expect(toggleCardId(['streak'], CARD_IDS.streak, AVAILABLE)).toEqual([]);
    expect(toggleCardId(['streak'], CARD_IDS.todayHours, AVAILABLE)).toEqual([
      'streak',
      'today-hours',
    ]);
  });

  it('moves a card by one step and ignores out-of-range moves', () => {
    const ids: readonly CardId[] = ['today-hours', 'week-summary', 'streak'];

    expect(moveCardId(ids, 'week-summary', -1)).toEqual(['week-summary', 'today-hours', 'streak']);
    expect(moveCardId(ids, 'week-summary', 1)).toEqual(['today-hours', 'streak', 'week-summary']);
    expect(moveCardId(ids, 'today-hours', -1)).toEqual(ids);
    expect(moveCardId(ids, 'streak', 1)).toEqual(ids);
    expect(moveCardId(ids, 'today-hours', 0)).toEqual(ids);
  });

  it('round-trips a snapshot and reads each scope', () => {
    const snapshot = parseSnapshot(JSON.stringify(toSnapshot({ today: [], profile: ['streak'] })));

    expect(readScope(snapshot, 'today')).toEqual([]);
    expect(readScope(snapshot, 'profile')).toEqual(['streak']);
    expect(readScope(snapshot, 'today')).not.toBeUndefined();
  });

  it('treats corrupt storage as missing configuration', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('{not json')).toBeNull();
    expect(readScope(parseSnapshot('null'), 'today')).toBeUndefined();
  });
});
