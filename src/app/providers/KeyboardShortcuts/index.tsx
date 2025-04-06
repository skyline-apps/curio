import { createContext, useContext, useEffect } from "react";

export type KeyboardShortcutHandler = (
  event: KeyboardEvent,
) => boolean | void | Promise<boolean> | Promise<void>;

export enum ShortcutType {
  DEFAULT = "Default",
  ACTIONS = "Actions",
  NAVIGATION = "Navigation",
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
interface KeyboardShortcutsContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  keyboardShortcuts: Record<string, Record<string, KeyboardShortcut[]>>;
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: (show: boolean) => void;
}

export const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextType>({
    registerShortcut: () => {},
    unregisterShortcut: () => {},
    keyboardShortcuts: {},
    showKeyboardShortcuts: false,
    setShowKeyboardShortcuts: () => {},
  });

export const useKeyboardShortcuts = (
  shortcut: Omit<KeyboardShortcut, "id">,
): void => {
  const { registerShortcut, unregisterShortcut } = useContext(
    KeyboardShortcutsContext,
  );

  useEffect(() => {
    const id = `${shortcut.key}-${Math.random().toString(36).substr(2, 9)}`;
    registerShortcut({ ...shortcut, id });
    return () => unregisterShortcut(id);
  }, [shortcut, registerShortcut, unregisterShortcut]);
};
