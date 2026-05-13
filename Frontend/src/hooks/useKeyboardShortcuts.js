import { useEffect } from "react";

export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // Build key combination string
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      
      const key = e.key === " " ? "Space" : e.key;
      parts.push(key);
      
      const keyCombo = parts.join("+");

      // Check if shortcut exists and execute
      if (shortcuts[keyCombo]) {
        e.preventDefault();
        shortcuts[keyCombo](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Usage example:
 * 
 * const shortcuts = {
 *   "Ctrl+s": (e) => saveCode(),
 *   "Ctrl+Enter": (e) => executeCode(),
 *   "Ctrl+/": (e) => toggleComment(),
 *   "Ctrl+Alt+l": (e) => formatCode()
 * };
 * useKeyboardShortcuts(shortcuts);
 */
