import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../src/components/ui.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX}}).outputText;
function harness(props = {}, {valid = true, approved = true} = {}) {
  const values = [], refs = []; let cursor = 0, refCursor = 0;
  const calls = {prompts: [], submitted: 0, validations: 0};
  const sync = {isSaving: false};
  const exports = {};
  vm.runInNewContext(compiled, {exports, require(name) {
    if (name === "react") return {
      useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => {values[index] = value;}]; },
      useRef(initial) { const index = refCursor++; return refs[index] ||= {current: initial}; },
      useEffect() {}
    };
    if (name === "react/jsx-runtime") return {jsx: (type, props) => ({type, props}), jsxs: (type, props) => ({type, props})};
    if (name.includes("BudgetContext")) return {useBudgetSync: () => sync};
    return {};
  }, window: {confirm(message) {calls.prompts.push(message);return approved;}},
  requestAnimationFrame(callback) { queueMicrotask(callback); return 1; }, cancelAnimationFrame() {}});
  const render = () => {cursor = 0;refCursor = 0;return exports.Button({children: "Save", type: "submit", ...props});};
  const form = {isConnected: true, reportValidity() {calls.validations++;return valid;}, requestSubmit(button) {assert.equal(button.form, form);calls.submitted++;}};
  const click = () => render().props.onClick({preventDefault() {},currentTarget: {form}});
  return {calls, click, render, sync};
}

test("canceling confirmation leaves the form untouched", async () => {
  const h = harness({}, {approved: false});await h.click();
  assert.equal(h.calls.prompts.length, 1);assert.equal(h.calls.submitted, 0);assert.equal(h.render().props.disabled, false);
});
test("invalid forms show validation before asking for confirmation", async () => {
  const h = harness({}, {valid: false});await h.click();
  assert.equal(h.calls.validations, 1);assert.equal(h.calls.prompts.length, 0);assert.equal(h.calls.submitted, 0);
});
test("confirmed submits run once and block immediate repeated clicks", async () => {
  const h = harness({confirm: "Transfer ₱300 to Emergency savings?"});
  const pending = h.click();assert.equal(h.render().props["aria-busy"], true);assert.equal(h.render().props.disabled, true);
  await h.click();await pending;
  assert.deepEqual(h.calls.prompts, ["Transfer ₱300 to Emergency savings?"]);assert.equal(h.calls.submitted, 1);
  h.sync.isSaving = true;assert.equal(h.render().props["aria-busy"], true);
  h.sync.isSaving = false;assert.equal(h.render().props.disabled, false);
});
test("Next skips confirmation and asynchronous actions stay busy until finished", async () => {
  let finish;const action = new Promise(resolve => {finish = resolve;});
  const h = harness({type: "button",confirm: false,onClick: () => action});
  const pending = h.click();await Promise.resolve();await Promise.resolve();
  assert.equal(h.render().props.disabled, true);finish();await pending;
  assert.equal(h.calls.prompts.length, 0);assert.equal(h.calls.submitted, 0);assert.equal(h.render().props.disabled, false);
});
test("failed actions release the button for retry", async () => {
  const h = harness({type: "button",onClick: async () => {throw new Error("Failed");}});
  await assert.rejects(h.click(), /Failed/);assert.equal(h.render().props.disabled, false);
});
