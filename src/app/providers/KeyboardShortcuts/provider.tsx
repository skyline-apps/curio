import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { KeyboardShortcut, KeyboardShortcutsContext, ShortcutType } from ".";

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export const KeyboardShortcutProvider: React.FC<
  KeyboardShortcutProviderProps
> = ({ children }) => {
  const shortcuts = useRef<Map<string, KeyboardShortcut>>(new Map());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] =
    useState<boolean>(false);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcuts.current.set(shortcut.id, {
      priority: 0,
      preventDefault: true,
      conditions: {
        notInInput: true,
      },
      ...shortcut,
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcuts.current.delete(id);
  }, []);

  useEffect(() => {
    registerShortcut({
      id: "shift-?",
      key: "?",
      name: "Show shortcuts",
      category: ShortcutType.DEFAULT,
      handler: () => {
        setShowKeyboardShortcuts(true);
      },
      conditions: {
        shiftKey: true,
      },
    });
  }, [registerShortcut]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const matchingShortcuts = Array.from(shortcuts.current.values())
        .filter((s) => s.key === event.key)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const shortcut of matchingShortcuts) {
        if (
          shortcut.conditions?.notInInput &&
          (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement)
        ) {
          continue;
        }

        if (shortcut.conditions?.shiftKey && !event.shiftKey) {
          continue;
        }

        if (shortcut.conditions?.ctrlKey && !(event.ctrlKey || event.metaKey)) {
          continue;
        }

        const result = shortcut.handler(event);

        if (result !== false && shortcut.preventDefault) {
          event.preventDefault();
        }

        if (result !== false) {
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const shortcutIds = Array.from(shortcuts.current.keys());

  const keyboardShortcuts = useMemo(() => {
    const result: Record<string, Record<string, KeyboardShortcut[]>> = {};
    Array.from(shortcuts.current.values()).forEach((shortcut) => {
      if (!result[shortcut.category]) {
        result[shortcut.category] = {};
      }
      if (!result[shortcut.category][shortcut.name]) {
        result[shortcut.category][shortcut.name] = [];
      }
      result[shortcut.category][shortcut.name].push(shortcut);
    });
    return result;
  }, [shortcutIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        showKeyboardShortcuts,
        setShowKeyboardShortcuts,
        keyboardShortcuts,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
