/** Block page zoom gestures while preserving ordinary scrolling and typing. */
export function preventPageZoom(target: Document) {
  const prevent = (event: Event) => event.preventDefault();
  const wheel = (event: WheelEvent) => { if (event.ctrlKey || event.metaKey) event.preventDefault(); };
  const keydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && (["+", "=", "-", "_", "0"].includes(event.key) || ["NumpadAdd", "NumpadSubtract", "Numpad0"].includes(event.code))) event.preventDefault();
  };
  const touch = (event: TouchEvent) => { if (event.touches.length > 1) event.preventDefault(); };
  target.addEventListener("wheel", wheel, { passive: false });
  target.addEventListener("keydown", keydown);
  target.addEventListener("touchstart", touch, { passive: false });
  target.addEventListener("touchmove", touch, { passive: false });
  target.addEventListener("gesturestart", prevent, { passive: false });
  target.addEventListener("gesturechange", prevent, { passive: false });
  return () => {
    target.removeEventListener("wheel", wheel);
    target.removeEventListener("keydown", keydown);
    target.removeEventListener("touchstart", touch);
    target.removeEventListener("touchmove", touch);
    target.removeEventListener("gesturestart", prevent);
    target.removeEventListener("gesturechange", prevent);
  };
}
