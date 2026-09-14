import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the budget tracker loading shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", new RegExp("^text/html\\b", "i"));

  const html = await response.text();
  assert.ok(html.includes("<title>Budget Tracker</title>"));
  assert.ok(html.includes("Loading your household budget workspace."));
  assert.equal(html.includes("codex-preview"), false);
  assert.equal(html.includes("Your site is taking shape"), false);
  assert.equal(html.includes("Codex is working"), false);
});

test("defines the simplified money in and money out flow", async () => {
  const [budgetApp, budgetTypes] = await Promise.all([
    readFile(new URL("../src/components/BudgetApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/types/budget.ts", import.meta.url), "utf8"),
  ]);

  assert.ok(budgetApp.includes('<Route path="/" element={<ActionHomePage />} />'));
  assert.ok(budgetApp.includes('label="Record Expense"'));
  assert.ok(budgetApp.includes('label="Record Income"'));
  assert.ok(budgetApp.includes('label="Dashboard"'));
  assert.ok(budgetApp.includes('Money Tracker'));
  assert.ok(budgetApp.includes('max-w-xl'));
  assert.ok(budgetApp.includes('Allocate each salary, then spend from what remains until the next salary is recorded.'));
  assert.ok(budgetApp.includes('function SalaryAllocationForm'));
  assert.ok(budgetApp.includes('function SalaryAllocationRow'));
  assert.ok(budgetApp.includes('Savings From Excess Money'));
  assert.ok(budgetApp.includes('function BackToChoices'));
  assert.ok(budgetApp.includes('<ArrowLeft size={17} />'));
  assert.ok(budgetApp.includes('<span>Back</span>'));
  assert.equal(budgetApp.includes('aria-label="Switch cutoff"'), false);
  assert.equal(budgetApp.includes('Current cutoff'), false);
  assert.ok(budgetApp.includes('FormQuestion label="Income For"'));
  assert.ok(budgetApp.includes('FormQuestion label="Income Source"'));
  assert.ok(budgetApp.includes('Available to Spend'));
  assert.ok(budgetApp.includes('function currentSalaryCycle'));
  assert.ok(budgetApp.includes('function SaveSuccessPopup'));
  assert.ok(budgetApp.includes('function todayInputValue'));
  assert.ok(budgetApp.includes('defaultValue={initial?.date || todayInputValue()}'));
  assert.ok(budgetApp.includes('Successfully saved'));
  assert.ok(budgetApp.includes('FormQuestion label="Whose Expense"'));
  assert.ok(budgetApp.includes('FormQuestion label="Amount"'));
  assert.ok(budgetApp.includes('FormQuestion label="Type of Expense"'));
  assert.ok(budgetApp.includes('FormQuestion label="Date"'));
  assert.ok(budgetApp.includes('FormQuestion label="Description"'));
  assert.equal(budgetApp.includes('Field label="Payment Method"'), false);
  assert.ok(budgetApp.includes('<option value="Shared Money">Shared fund</option>'));
  assert.ok(budgetApp.includes('"Pag-IBIG Loan"'));
  assert.ok(budgetApp.includes('"SSS Loan"'));
  assert.ok(budgetTypes.includes('"Government Loan"'));
  assert.ok(budgetTypes.includes('salaryAllocations: SalaryAllocation[];'));
  assert.ok(budgetTypes.includes('salarySavingsRecords: SalarySavingsRecord[];'));
});
