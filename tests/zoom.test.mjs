import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const source = await readFile(new URL("../src/utils/zoom.ts", import.meta.url), "utf8");
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { preventPageZoom } = context.exports;
function dispatch(target, type, properties = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, properties);
  target.dispatchEvent(event);
  return event.defaultPrevented;
}
test("blocks zoom shortcuts and wheel gestures without blocking typing or scrolling", () => {
  const target = new EventTarget();
  const cleanup = preventPageZoom(target);
  for (const key of ["+", "=", "-", "_", "0"]) {
    assert.equal(dispatch(target, "keydown", { ctrlKey: true, key }), true);
    assert.equal(dispatch(target, "keydown", { metaKey: true, key }), true);
    assert.equal(dispatch(target, "keydown", { key }), false);
  }
  assert.equal(dispatch(target, "keydown", { ctrlKey: true, key: "c" }), false);
  assert.equal(dispatch(target, "wheel", { ctrlKey: true }), true);
  assert.equal(dispatch(target, "wheel"), false);
  assert.equal(dispatch(target, "touchmove", { touches: [{}, {}] }), true);
  assert.equal(dispatch(target, "touchmove", { touches: [{}] }), false);
  assert.equal(dispatch(target, "gesturestart"), true);
  assert.equal(dispatch(target, "gesturechange"), true);
  cleanup();
  assert.equal(dispatch(target, "wheel", { ctrlKey: true }), false);
  assert.equal(dispatch(target, "keydown", { ctrlKey: true, key: "+" }), false);
  assert.equal(dispatch(target, "gesturestart"), false);
  assert.equal(dispatch(target, "touchmove", { touches: [{}, {}] }), false);
});
