type ShortcutElement = EventTarget & Pick<Element, 'closest' | 'getAttribute' | 'matches'>;

function isShortcutElement(target: EventTarget | null): target is ShortcutElement {
  const candidate = target as unknown as Partial<ShortcutElement> | null;
  return Boolean(
    candidate &&
    typeof candidate.closest === 'function' &&
    typeof candidate.matches === 'function' &&
    typeof candidate.getAttribute === 'function'
  );
}

function isEditableContentElement(element: ShortcutElement | null) {
  if (!element) return false;
  const editable = element.closest('[contenteditable]');
  return Boolean(editable && editable.getAttribute('contenteditable') !== 'false');
}

export function shouldIgnoreGlobalKeyboardShortcut(
  target: EventTarget | null,
  options: {
    allowTarget?: (target: ShortcutElement) => boolean;
    ignoreWithinSelector?: string;
  } = {}
) {
  if (!isShortcutElement(target)) return false;
  if (options.allowTarget?.(target)) return false;
  if (options.ignoreWithinSelector && target.closest(options.ignoreWithinSelector)) return true;
  return Boolean(target.closest('input, textarea, select') || isEditableContentElement(target));
}
