import Kbd, { type KbdKey } from "@app/components/ui/Kbd";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@app/components/ui/Modal";
import { KeyboardShortcutsContext } from "@app/providers/KeyboardShortcuts";
import React, { useContext } from "react";

const KeyboardShortcuts = (): React.ReactElement => {
  const { keyboardShortcuts, showKeyboardShortcuts, setShowKeyboardShortcuts } =
    useContext(KeyboardShortcutsContext);

  return (
    <Modal
      isOpen={showKeyboardShortcuts}
      onClose={() => setShowKeyboardShortcuts(false)}
      size="4xl"
    >
      <ModalContent>
        <ModalHeader>Keyboard shortcuts</ModalHeader>
        <ModalBody className="overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {Object.entries(keyboardShortcuts).map(([category, names]) => (
              <div key={category} className="text-sm">
                <h2 className="font-medium text-secondary">{category}</h2>
                <div className="grid grid-cols-[140px_auto] items-center gap-2">
                  {Object.entries(names).map(([name, shortcutList]) => (
                    <React.Fragment key={name}>
                      <div className="flex gap-2">
                        {shortcutList.map((shortcut, index) => {
                          const keys: KbdKey[] = [];
                          if (shortcut.conditions?.shiftKey) keys.push("shift");
                          if (shortcut.conditions?.ctrlKey) keys.push("ctrl");
                          return (
                            <React.Fragment key={shortcut.key}>
                              <Kbd keys={keys}>{shortcut.key}</Kbd>
                              {index < shortcutList.length - 1 && (
                                <span> or </span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <p>{name}</p>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default KeyboardShortcuts;
