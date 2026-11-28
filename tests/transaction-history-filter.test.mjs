import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';

const source = await readFile(new URL('../src/components/BudgetApp.tsx', import.meta.url), 'utf8');
const component = source.slice(source.indexOf('function TransactionHistoryPage()'), source.indexOf('function ExpenseTypesSettings()'));

test('category changes remove other categories despite shared record IDs and select the correct details', () => {
  const records = [
    { id: 'tx-shared', type: 'Savings Contribution', category: 'Savings', date: '2026-11-20', description: 'Deposit', person: 'Ruru', wallet: 'Cash', destination: 'Emergency' },
    { id: 'tx-shared', type: 'Fund Transfer', category: 'Wallet Transfer', date: '2026-11-21', description: 'Transfer', person: 'Joselle', wallet: 'Cash', destination: 'GCash' },
    { id: 'tx-food', type: 'Expense', category: 'Food', date: '2026-11-22', description: 'Lunch', person: 'Ruru', wallet: 'GCash' },
  ];
  const values = [];
  let cursor = 0;
  const context = {
    transactionDetails: (_, transaction) => ({ person: transaction.person, wallet: transaction.wallet || 'Not recorded', destination: transaction.destination }), Button: 'button', React, Intl, Date, inputClass: '', PageHeader: 'header', Panel: 'section', StatusBadge: 'span', MoneyDisplay: 'span', TransactionDetails: 'dialog',
    formatShortDate: value => value, useActiveFinance: () => ({ state: {} }), buildTransactions: () => records,
    useState: initial => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => { values[index] = value; }]; },
  };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(component + '\nglobalThis.render = TransactionHistoryPage;', { compilerOptions: { jsx: ts.JsxEmit.React } }).outputText, context);
  const render = () => { cursor = 0; return context.render(); };
  const find = (node, predicate) => {
    const result = [];
    const visit = element => { if (!React.isValidElement(element)) return; if (predicate(element)) result.push(element); React.Children.forEach(element.props.children, visit); };
    visit(node); return result;
  };
  let tree = render();
  const rows = find(tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog');
  assert.equal(new Set(rows.map(row => row.key)).size, records.length);
  rows[1].props.onClick();
  tree = render();
  assert.equal(find(tree, node => node.type === 'dialog')[0].props.transaction.type, 'Fund Transfer');
  for (const category of ['Savings', 'Wallet Transfer', 'Food', 'All']) {
    find(tree, node => node.props['aria-label'] === 'Filter by category')[0].props.onChange({ target: { value: category } });
    tree = render();
    const expected = records.filter(record => category === 'All' || record.category === category).sort((a, b) => b.date.localeCompare(a.date));
    assert.deepEqual(find(tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog').map(row => row.key), expected.map(record => record.type + ':' + record.id));
  }
  const change = (label, value) => {
    find(tree, node => node.props['aria-label'] === label)[0].props.onChange({ target: { value } });
    tree = render();
  };
  const keys = () => find(tree, node => node.props['aria-haspopup'] === 'dialog').map(row => row.key);
  change('Filter by wallet', 'GCash');
  assert.deepEqual(keys(), ['Expense:tx-food', 'Fund Transfer:tx-shared']);
  change('Filter by user', 'Joselle');
  assert.deepEqual(keys(), ['Fund Transfer:tx-shared']);
  change('Filter from date', '2026-11-21');
  change('Filter to date', '2026-11-21');
  assert.deepEqual(keys(), ['Fund Transfer:tx-shared']);
  change('Filter to date', '2026-11-20');
  assert.deepEqual(keys(), []);
  find(tree, node => node.type === 'button' && node.props.children === 'Clear filters')[0].props.onClick();
  tree = render();
  assert.equal(keys().length, 3);

});
