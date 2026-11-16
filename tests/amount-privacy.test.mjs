import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/amountPrivacy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { maskAmount, authorizeAmountVisibility } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
test("amounts with centavos retain only the last four digits", () => {
  assert.equal(maskAmount(12345.67, "₱12,345.67"), "₱**,*45.67");
  assert.equal(maskAmount(12345.6, "₱12,345.60"), "₱**,*45.60");
  assert.equal(maskAmount(-12345.67, "-₱12,345.67"), "-₱**,*45.67");
});
test("whole amounts retain only the last two digits without artificial centavos", () => {
  assert.equal(maskAmount(12345, "₱12,345.00"), "₱**,*45");
  assert.equal(maskAmount(100, "₱100.00"), "₱*00");
  assert.equal(maskAmount(12, "₱12.00"), "₱12");
  assert.equal(maskAmount(0, "₱0.00"), "₱0");
});
test("every visibility change waits for password verification", async () => {
  let changes = 0; let checks = 0;
  const verify = async password => { checks++; assert.equal(password, "correct"); };
  for (let attempt = 0; attempt < 2; attempt++) await authorizeAmountVisibility(verify, "correct", () => changes++);
  assert.equal(checks, 2); assert.equal(changes, 2);
  await assert.rejects(authorizeAmountVisibility(verify, "", () => changes++), /Enter your account/);
  await assert.rejects(authorizeAmountVisibility(async () => { throw new Error("Wrong password"); }, "wrong", () => changes++), /Wrong password/);
  assert.equal(changes, 2);
});
