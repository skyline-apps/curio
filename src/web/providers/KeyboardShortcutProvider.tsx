"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

export type KeyboardShortcutHandler = (event: KeyboardEvent) => boolean | void;

export interface KeyboardShortcut {
  id: string;
  key: string;
  name: string;
  handler: KeyboardShortcutHandler;
  priority?: number;
  preventDefault?: boolean;
  conditions?: {
    notInInput?: boolean;
  };
}

interface KeyboardShortcutContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
}

export const KeyboardShortcutContext =
  createContext<KeyboardShortcutContextType>({
    registerShortcut: () => {},
    unregisterShortcut: () => {},
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

  return (
    <KeyboardShortcutContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
      }}
    >
      {children}
    </KeyboardShortcutContext.Provider>
  );
};
