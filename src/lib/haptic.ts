let label: HTMLLabelElement | undefined;

/**
 * Лёгкая вибро-отдача. Android — navigator.vibrate.
 * iOS Safari не поддерживает vibrate, но iOS 18+ даёт haptic при переключении
 * <input type="checkbox" switch> — используем этот приём (нужен жест пользователя).
 */
export function haptic() {
  try {
    if ('vibrate' in navigator) { navigator.vibrate(12); return; }
    if (!label) {
      label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.cssText = 'position:fixed;left:-100px;top:-100px;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      label.appendChild(input);
      document.body.appendChild(label);
    }
    label.click();
  } catch { /* не критично */ }
}
