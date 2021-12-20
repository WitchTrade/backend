const tagSlotToId = {
  ingredient: 1,
  body: 2,
  hat: 3,
  head: 4,
  'skin color': 5,
  'player icon': 6,
  'upper body': 7,
  'lower body': 8,
  'melee weapon': 9,
  projectile: 10,
  broom: 11,
  recipe: 12,
};

export function getIdOfItemSlot(tagSlot: string): number {
  return tagSlotToId[tagSlot];
}
