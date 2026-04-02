export const patchMethod = <
  TObject extends object,
  TKey extends keyof TObject,
>(
  target: TObject,
  key: TKey,
  replacement: TObject[TKey],
) => {
  const original = target[key];
  target[key] = replacement;

  return () => {
    target[key] = original;
  };
};
