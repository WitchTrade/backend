const knownEventItems = [
  { name: 'Gunpowder', tagSlot: 'ingredient' },
  { name: 'Fireworks', tagSlot: 'ingredient' },
  { name: 'Cinnamon Star', tagSlot: 'ingredient' },
  { name: 'Filled Boot', tagSlot: 'chest' },
  { name: 'Gloomkin', tagSlot: 'chest' },
  { name: 'Cryptic Artifact', tagSlot: 'chest' },
];

export function isKnownEventItem(name: string, tagSlot: string): boolean {
  return knownEventItems.some(
    (kei) => kei.name === name && kei.tagSlot === tagSlot,
  );
}
