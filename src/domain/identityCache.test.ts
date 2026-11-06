import { parseIdentityCache, isIdentityFresh, IDENTITY_TTL } from './identityCache';
const snapshot = { version: 1, userId: 'u1', fetchedAt: 1000, profile: { id: 'u1', displayName: '昵称', avatarUrl: null, createdAt: '', updatedAt: '' }, families: [{ id: 'f1', name: '家', ownerId: 'u1', createdAt: '' }], members: { f1: [{ familyId: 'f1', userId: 'u1', role: 'owner', displayName: '昵称', avatarUrl: null }] } };
describe('identity cache', () => {
  it('parses only complete snapshots belonging to the requested user', () => {
    expect(parseIdentityCache(JSON.stringify(snapshot), 'u1')).toEqual(snapshot);
    expect(parseIdentityCache(JSON.stringify(snapshot), 'u2')).toBeNull();
    expect(parseIdentityCache('{broken', 'u1')).toBeNull();
    expect(parseIdentityCache(null, 'u1')).toBeNull();
  });
  it.each([
    { ...snapshot, version: 0 },
    { ...snapshot, profile: { ...snapshot.profile, id: 'u2' } },
    { ...snapshot, fetchedAt: '1000' },
    { ...snapshot, families: [{}] },
    { ...snapshot, members: {} },
    { ...snapshot, members: { f1: [{ ...snapshot.members.f1[0], familyId: 'f2' }] } },
    { ...snapshot, members: { f1: [{ ...snapshot.members.f1[0], role: 'admin' }] } },
  ])('rejects malformed data', (bad) => {
    expect(parseIdentityCache(JSON.stringify(bad), 'u1')).toBeNull();
  });
  it('expires at 24 hours and rejects future or missing timestamps', () => {
    expect(isIdentityFresh(1000, 1000 + IDENTITY_TTL - 1)).toBe(true);
    expect(isIdentityFresh(1000, 1000 + IDENTITY_TTL)).toBe(false);
    expect(isIdentityFresh(1001, 1000)).toBe(false);
    expect(isIdentityFresh(null, 1000)).toBe(false);
  });
});
