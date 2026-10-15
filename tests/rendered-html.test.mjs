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

test("keeps the current workflow and removes retired routes", async () => {
  const source = await readFile(new URL("../src/components/BudgetApp.tsx", import.meta.url), "utf8");
  const routes = [...source.matchAll(/<Route path="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(routes, ["/", "/dashboard", "/income", "/expenses", "/expense-history", "/bills", "/debts", "/wishlist", "/transactions", "/settings", "*"]);
  for (const label of ["Todays Expense", "Money In", "Dashboard"]) assert.ok(source.includes('label="' + label + '"'));
});
