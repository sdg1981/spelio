import { shouldIgnoreGlobalKeyboardShortcut } from '../src/lib/keyboardShortcuts';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

class FakeElement extends EventTarget {
  private parent: FakeElement | null;

  constructor(
    private tagName: string,
    private attributes: Record<string, string> = {},
    parent: FakeElement | null = null
  ) {
    super();
    this.parent = parent;
  }

  closest(selector: string): FakeElement | null {
    for (let element: FakeElement | null = this; element; element = element.parent) {
      if (element.matches(selector)) return element;
    }
    return null;
  }

  matches(selector: string): boolean {
    return selector.split(',').map(part => part.trim()).some(part => {
      if (part === this.tagName) return true;
      if (part === '[contenteditable]') return Object.prototype.hasOwnProperty.call(this.attributes, 'contenteditable');
      if (part.startsWith('.') && (this.attributes.class ?? '').split(/\s+/).includes(part.slice(1))) return true;
      return false;
    });
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }
}

const input = new FakeElement('input');
assertEqual(shouldIgnoreGlobalKeyboardShortcut(input), true, 'Global shortcuts should ignore focused inputs.');

const textarea = new FakeElement('textarea');
assertEqual(shouldIgnoreGlobalKeyboardShortcut(textarea), true, 'Global shortcuts should ignore focused textareas.');

const select = new FakeElement('select');
assertEqual(shouldIgnoreGlobalKeyboardShortcut(select), true, 'Global shortcuts should ignore focused selects.');

const editable = new FakeElement('div', { contenteditable: 'true' });
assertEqual(shouldIgnoreGlobalKeyboardShortcut(editable), true, 'Global shortcuts should ignore contenteditable elements.');

const notEditable = new FakeElement('div', { contenteditable: 'false' });
assertEqual(shouldIgnoreGlobalKeyboardShortcut(notEditable), false, 'contenteditable=false should not be treated as an editable target.');

const wrapper = new FakeElement('div', { contenteditable: 'true' });
const nested = new FakeElement('span', {}, wrapper);
assertEqual(shouldIgnoreGlobalKeyboardShortcut(nested), true, 'Global shortcuts should ignore children of contenteditable elements.');

const customKeyboard = new FakeElement('div', { class: 'spelio-touch-keyboard-shell' });
const customKeyboardButton = new FakeElement('button', {}, customKeyboard);
assertEqual(
  shouldIgnoreGlobalKeyboardShortcut(customKeyboardButton, { ignoreWithinSelector: '.spelio-touch-keyboard-shell' }),
  true,
  'Global shortcuts should ignore targets inside explicitly ignored shortcut regions.'
);

const allowedInput = new FakeElement('input');
assertEqual(
  shouldIgnoreGlobalKeyboardShortcut(allowedInput, { allowTarget: target => target === allowedInput as EventTarget }),
  false,
  'A caller may explicitly allow a special input target such as the hidden practice input.'
);

const button = new FakeElement('button');
assertEqual(shouldIgnoreGlobalKeyboardShortcut(button), false, 'Buttons should remain available to their own activation handling.');

console.log('keyboard shortcut tests passed');
