"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type KeyboardShortcutHandler = (event: KeyboardEvent) => boolean | void;

export enum ShortcutType {
  ITEMS = "Items",
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  name: string;
  category: ShortcutType;
  handler: KeyboardShortcutHandler;
  priority?: number;
  preventDefault?: boolean;
  conditions?: {
    notInInput?: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean; // Also cmd on Macs
  };
}

interface KeyboardShortcutContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  keyboardShortcuts: Record<string, Record<string, KeyboardShortcut[]>>;
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: (show: boolean) => void;
}

export const KeyboardShortcutContext =
  createContext<KeyboardShortcutContextType>({
    registerShortcut: () => {},
    unregisterShortcut: () => {},
    keyboardShortcuts: {},
    showKeyboardShortcuts: false,
    setShowKeyboardShortcuts: () => {},
  });

export const useKeyboardShortcut = (
  shortcut: Omit<KeyboardShortcut, "id">,
): void => {
  const { registerShortcut, unregisterShortcut } = useContext(
    KeyboardShortcutContext,
  );

  useEffect(() => {
    const id = `${shortcut.key}-${Math.random().toString(36).substr(2, 9)}`;
    registerShortcut({ ...shortcut, id });
    return () => unregisterShortcut(id);
  }, [shortcut, registerShortcut, unregisterShortcut]);
};

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
      category: "Default",
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
    <KeyboardShortcutContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        showKeyboardShortcuts,
        setShowKeyboardShortcuts,
        keyboardShortcuts,
      }}
    >
      {children}
    </KeyboardShortcutContext.Provider>
  );
};
