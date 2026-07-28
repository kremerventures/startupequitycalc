#!/usr/bin/env node
'use strict';

/**
 * Dependency-free automated audit for Founder Calc.
 * Run from the project root with:
 *   node tests/audit-founder-calc.js
 *
 * The audit executes the production inline JavaScript from index.html in a
 * mocked DOM, calls the production pure calculation function directly, and
 * verifies both math and user-facing output.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');
const serviceWorkerPath = path.join(projectRoot, 'service-worker.js');
const html = fs.readFileSync(indexPath, 'utf8');
const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);

if (!scriptMatch) {
  console.error('ERROR: Could not find the inline <script> in index.html.');
  process.exit(2);
}

class ClassList {
  constructor() { this.values = new Set(); }
  toggle(name, force) {
    if (force === undefined) {
      this.values.has(name) ? this.values.delete(name) : this.values.add(name);
    } else if (force) {
      this.values.add(name);
    } else {
      this.values.delete(name);
    }
  }
  contains(name) { return this.values.has(name); }
}

class ElementMock {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.classList = new ClassList();
  }
  addEventListener() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  select() {}
  scrollIntoView() {}
}

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const elements = Object.fromEntries(ids.map((id) => [id, new ElementMock(id)]));

elements.founderEq.value = '100';
elements.exit.value = '100M';
elements.goal.value = '20M';
elements.futureDilution.value = '50';
elements.pre.value = '8M';
elements.raise.value = '2M';

const document = {
  getElementById(id) { return elements[id]; },
  querySelectorAll() { return []; },
};

const localStorage = {
  values: {},
  setItem(key, value) { this.values[key] = value; },
  getItem(key) { return this.values[key] ?? null; },
};

const context = vm.createContext({
  console,
  document,
  localStorage,
  navigator: {},
  window: { addEventListener() {} },
  Number,
  String,
  Math,
  JSON,
});

vm.runInContext(scriptMatch[1], context, { filename: 'index.html:inline-script' });

function runCase(values) {
  elements.raise.value = values.raise;
  elements.pre.value = values.pre;
  elements.exit.value = values.exit;
  elements.goal.value = values.goal;
  elements.founderEq.value = values.eq;
  elements.futureDilution.value = String(values.fd);
  vm.runInContext('calc()', context);
  return {
    payout: elements.founderPayout.textContent,
    headline: elements.headlineSub.textContent,
    investor: elements.investorOwns.textContent,
    founderNow: elements.founderNow.textContent,
    otherHolders: elements.otherHolders.textContent,
    othersToday: elements.othersToday.textContent,
    founderExit: elements.founderExitPct.textContent,
    neededNow: elements.neededNow.textContent,
    gap: elements.gapText.textContent,
    postMoney: elements.postMoney.textContent,
    ownershipTotal: elements.ownershipTotal.textContent,
    exitAssumptions: elements.exitAssumptions.textContent,
    headlineGood: elements.headlineCard.classList.contains('good'),
    headlineBad: elements.headlineCard.classList.contains('bad'),
    needGood: elements.needCard.classList.contains('good'),
    needBad: elements.needCard.classList.contains('bad'),
    preInvalid: elements.preField.classList.contains('invalid'),
    raiseInvalid: elements.raiseField.classList.contains('invalid'),
    exitInvalid: elements.exitField.classList.contains('invalid'),
    goalInvalid: elements.goalField.classList.contains('invalid'),
  };
}

let failures = 0;
function pass(name) { console.log(`PASS  ${name}`); }
function fail(name, details) {
  failures += 1;
  console.log(`FAIL  ${name}`);
  if (details) console.log(`      ${details}`);
}
function equal(name, actual, expected) {
  if (actual === expected) pass(name);
  else fail(name, `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}
function truthy(name, value, details) {
  if (value) pass(name);
  else fail(name, details || 'Expected a truthy value.');
}
function close(name, actual, expected, tolerance = 1e-10) {
  if (Math.abs(actual - expected) <= tolerance) pass(name);
  else fail(name, `Expected ${expected}, received ${actual}`);
}

console.log('\nFounder Calc automated audit\n');

// Requested wording and controls.
truthy('Uses “Targeted exit valuation” label', html.includes('Targeted exit valuation'));
truthy('Includes $25M targeted-exit shortcut', html.includes('data-target="exit" data-value="25000000">$25M'));
truthy('Uses “Founder payout target at exit” label', html.includes('Founder payout target at exit'));
truthy('Includes $50M founder-payout-target shortcut', html.includes('data-target="goal" data-value="50000000">$50M'));
truthy('Uses “Expected future dilution through exit” label', html.includes('Expected future dilution through exit'));
truthy('Results are split into ownership and exit sections', html.includes('3. Ownership after this round') && html.includes('4. Projected outcome at exit'));
truthy('Founder ownership is listed first after the round', html.indexOf('>Founder ownership<') < html.indexOf('Round investor ownership'));
truthy('Section 3 card names drop the redundant "after this round"', !html.includes('Founder ownership after this round') && !html.includes('Other equity holders after this round'));
truthy('Other-holders note excludes founder and round investors', html.includes('other than the founder and round investors'));
truthy('Other equity holders are displayed', html.includes('>Other equity holders<'));
truthy('Needed ownership is placed in the exit outcome section', html.indexOf('Needed after this round to hit payout target') > html.indexOf('Founder equity after future dilution'));
truthy('Percent suffix spacing is tightened', html.includes('.field .valRow.suffix{gap:0}'));

// Ownership-today block: You + Everyone else always total 100%.
truthy('Setup shows a "Your ownership today" field', html.includes('>Your ownership today</label>'));
truthy('Founder ownership is an editable % field like the others', html.includes('id="founderEq"') && html.indexOf('Your ownership today') < html.indexOf('id="founderEq"'));
truthy('Ownership field shows a read-only "Everyone else" mirror', html.includes('Everyone else') && html.includes('id="othersToday"'));
truthy('Dilution chips are 40/50/60/75/90', ['40','50','60','75','90'].every(v => html.includes(`data-dilution="${v}"`)) && !html.includes('data-dilution="25"'));

// Collapsible setup shows an explicit expand/collapse affordance.
truthy('Setup toggle has an expand/collapse hint element', html.includes('id="tapHint"'));
truthy('Collapsed hint reads "Tap to expand"', html.includes('Tap to expand'));
truthy('Expanded hint reads "Tap to roll up"', html.includes('Tap to roll up'));

// Dilution slider spans the full 0-100 range.
truthy('Dilution slider max is 100', /id="futureDilution"[^>]*max="100"/.test(html));
truthy('Dilution slider min is 0 and defaults to 50', /id="futureDilution"[^>]*min="0"/.test(html) && /id="futureDilution"[^>]*value="50"/.test(html));

// Deal controls and typing affordances.
truthy('Raise has a $5M quick chip', html.includes('data-target="raise" data-value="5000000">$5M'));
truthy('Money shorthand hint uses "etc." and drops the 1e6 example', html.includes('Type shortcuts like 500k, 2.5M, etc.') && !html.includes('500k, 2.5M, or 1e6'));
truthy('Setup money fields hint that you can type your own amount', html.includes('Tap to type your own amount.'));
truthy('Ownership field hints that you can type any %', html.includes('Tap to type any %'));

// Marketing: brand renamed and a contact CTA on the brand line.
truthy('Brand eyebrow reads "KV Consulting"', html.includes('>KV Consulting<'));
truthy('Old "Kremer Ventures" brand name is gone', !html.includes('Kremer Ventures'));
truthy('Header includes a mailto contact link', html.includes('href="mailto:kremer@kremerventures.com'));
truthy('Contact link sits on the brand row', html.includes('class="brandRow"') && html.indexOf('brandRow') < html.indexOf('<h1>'));

// Known-answer cases.
let result = runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '20M', eq: '100', fd: 50 });
equal('Default: founder after round', result.founderNow, '80%');
equal('Default: round investor ownership', result.investor, '20%');
equal('Default: other holders', result.otherHolders, '0%');
equal('Default: ownership total', result.ownershipTotal, 'Totals 100%');
equal('Default: founder after future dilution', result.founderExit, '40%');
equal('Default: estimated founder payout', result.payout, '$40M');
equal('Default: needed after round', result.neededNow, '40%');
equal('Default: exit section title states live assumptions', result.exitAssumptions, ': $100M exit and 50% future dilution');

result = runCase({ raise: '1M', pre: '4M', exit: '100M', goal: '20M', eq: '60', fd: 0 });
equal('Existing holders: founder after round', result.founderNow, '48%');
equal('Existing holders: round investor', result.investor, '20%');
equal('Existing holders: other equity holders', result.otherHolders, '32%');
equal('Existing holders: ownership total', result.ownershipTotal, 'Totals 100%');
equal('Existing holders: estimated payout', result.payout, '$48M');

result = runCase({ raise: '0', pre: '8M', exit: '100M', goal: '20M', eq: '75', fd: 40 });
equal('Zero raise: round investor', result.investor, '0%');
equal('Zero raise: founder after round unchanged', result.founderNow, '75%');
equal('Zero raise: other holders unchanged', result.otherHolders, '25%');
equal('Zero raise: founder after future dilution', result.founderExit, '45%');
equal('Zero raise: payout', result.payout, '$45M');

result = runCase({ raise: '1M', pre: '1M', exit: '100M', goal: '50M', eq: '100', fd: 0 });
equal('50/50 round: investor', result.investor, '50%');
equal('50/50 round: founder', result.founderNow, '50%');
equal('50/50 round: payout', result.payout, '$50M');
truthy('50/50 round: exact target clears', result.headlineGood && /Clears/.test(result.headline));

// Blank founder equity intentionally continues to mean 100%.
result = runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '20M', eq: '', fd: 50 });
equal('Blank founder equity intentionally defaults to 100%', result.founderNow, '80%');
equal('Ownership today: blank equity mirrors 0% to everyone else', result.othersToday, '0');

// Ownership-today read-only mirror is the pre-round complement of "You".
equal('Ownership today: full founder ownership shows 0% others',
  runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '20M', eq: '100', fd: 50 }).othersToday, '0');
equal('Ownership today: 60% founder mirrors 40% others (pre-round, not post)',
  runCase({ raise: '1M', pre: '4M', exit: '100M', goal: '20M', eq: '60', fd: 0 }).othersToday, '40');
equal('Ownership today: 50% founder mirrors 50% others',
  runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '20M', eq: '50', fd: 50 }).othersToday, '50');

// Near-hurdle precision.
result = runCase({ raise: '2M', pre: '8M', exit: '49.9M', goal: '20M', eq: '100', fd: 50 });
equal('Near miss displays precise payout', result.payout, '$19.96M');
truthy('Near miss is clearly labeled below target', result.headlineBad && /Below/.test(result.headline));

result = runCase({ raise: '2M', pre: '8M', exit: '50.1M', goal: '20M', eq: '100', fd: 50 });
equal('Near pass displays precise payout', result.payout, '$20.04M');
truthy('Near pass is clearly labeled as clearing target', result.headlineGood && /Clears/.test(result.headline));

// Rounding must never make the displayed payout contradict the pass/fail verdict.
// $19.996M rounds to "$20M": the verdict must agree with what the number shows.
result = runCase({ raise: '2M', pre: '8M', exit: '49.99M', goal: '20M', eq: '100', fd: 50 });
equal('Payout rounding onto the target displays $20M', result.payout, '$20M');
truthy('Displayed payout never says $20M while claiming it is below', !(result.headlineBad && result.payout === '$20M'));
truthy('At display resolution the target is treated as cleared', result.headlineGood && /Clears/.test(result.headline));
truthy('Need card agrees with the headline verdict', result.needGood && !result.needBad);

result = runCase({ raise: '2M', pre: '8M', exit: '50.01M', goal: '20M', eq: '100', fd: 50 });
equal('Just-above-target payout also displays $20M', result.payout, '$20M');
truthy('Just-above target clears without contradiction', result.headlineGood && /Clears/.test(result.headline));

// A missing exit should prompt, not assert a believable-looking miss.
result = runCase({ raise: '2M', pre: '8M', exit: '', goal: '20M', eq: '100', fd: 50 });
truthy('Blank exit prompts instead of asserting a miss', /Add a targeted exit/.test(result.headline));
truthy('Blank exit does not mark the payout card as failed', !result.headlineBad);
equal('Blank exit omits the assumptions from the exit title', result.exitAssumptions, '');
equal('Exit title reflects a different exit and dilution',
  runCase({ raise: '2M', pre: '8M', exit: '250M', goal: '20M', eq: '100', fd: 75 }).exitAssumptions,
  ': $250M exit and 75% future dilution');

// Full future dilution (now reachable since the slider goes to 100) wipes out
// the payout; the verdict and "needed" card must stay coherent, not divide by zero.
result = runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '20M', eq: '100', fd: 100 });
equal('Full dilution: payout is $0', result.payout, '$0');
truthy('Full dilution: target flagged as unreachable', /cannot be reached/i.test(result.headline));
equal('Full dilution: needed shows "Not possible"', result.neededNow, 'Not possible');
truthy('Full dilution: no divide-by-zero garbage in the needed note', /nothing is left|nothing at exit/i.test(result.gap) && !/Infinity/.test(result.gap));
const wipeout = vm.runInContext("calculateFounderCalc({raise:2000000,pre:8000000,exitV:100000000,goal:20000000,eq:1,fd:1})", context);
truthy('Full dilution pure fn: impossible flag set', wipeout.impossible === true);
truthy('Full dilution pure fn: needed is non-finite (cannot reach a positive goal)', !Number.isFinite(wipeout.neededAfterRound));

// Impossible goal messaging.
result = runCase({ raise: '2M', pre: '8M', exit: '100M', goal: '120M', eq: '100', fd: 50 });
equal('Impossible target uses plain-language value', result.neededNow, 'Not possible');
truthy('Impossible target explains assumptions cannot work', /cannot be reached/i.test(result.headline));
truthy('Impossible target shows required percentage', /240%/.test(result.gap));
truthy('Impossible target card is marked bad', result.needBad);

// Input parsing and visible invalid state.
equal('Scientific notation parses correctly', vm.runInContext("num('1e6')", context), 1000000);
equal('Scientific notation with decimal parses correctly', vm.runInContext("num('2.5e7')", context), 25000000);
equal('Money shorthand parses correctly', vm.runInContext("num('$2.5M')", context), 2500000);
equal('Comma-formatted money parses correctly', vm.runInContext("num('$2,500,000')", context), 2500000);
truthy('Negative money is rejected', vm.runInContext("parseMoney('-1M').valid === false", context));
truthy('Letters are rejected', vm.runInContext("parseMoney('abc').valid === false", context));
result = runCase({ raise: '1M', pre: 'abc', exit: '100M', goal: '20M', eq: '100', fd: 50 });
equal('Invalid money prevents believable founder result', result.founderNow, '—');
truthy('Invalid money highlights the affected field', result.preInvalid);

// Pure production-function tests.
const pure = vm.runInContext("calculateFounderCalc({raise:1000000,pre:4000000,exitV:100000000,goal:20000000,eq:0.6,fd:0})", context);
close('Pure function: founder after round', pure.founderAfterRound, 0.48);
close('Pure function: investor ownership', pure.investorOwnership, 0.20);
close('Pure function: other holders', pure.otherHoldersAfterRound, 0.32);
close('Pure function: ownership conservation', pure.founderAfterRound + pure.investorOwnership + pure.otherHoldersAfterRound, 1);

let randomMismatch = null;
for (let i = 0; i < 10000; i += 1) {
  const pre = Math.random() * 1e9;
  const raise = Math.random() * 5e8;
  const exitV = 1 + Math.random() * 5e9;
  const goal = Math.random() * 1e9;
  const eq = Math.random();
  const fd = Math.random() * 0.8;

  const actual = vm.runInContext(
    `calculateFounderCalc(${JSON.stringify({ raise, pre, exitV, goal, eq, fd })})`,
    context,
  );
  const post = pre + raise;
  const retention = post ? pre / post : 1;
  const expected = {
    investorOwnership: post ? raise / post : 0,
    founderAfterRound: eq * retention,
    otherHoldersAfterRound: (1 - eq) * retention,
    founderAfterFutureDilution: eq * retention * (1 - fd),
    founderPayout: eq * retention * (1 - fd) * exitV,
    neededAfterRound: (goal / exitV) / (1 - fd),
  };

  for (const [key, expectedValue] of Object.entries(expected)) {
    const tolerance = Math.max(1e-8, Math.abs(expectedValue) * 1e-11);
    if (Math.abs(actual[key] - expectedValue) > tolerance) {
      randomMismatch = { iteration: i, key, actual: actual[key], expected: expectedValue };
      break;
    }
  }
  const total = actual.founderAfterRound + actual.otherHoldersAfterRound + actual.investorOwnership;
  if (!randomMismatch && Math.abs(total - 1) > 1e-10) {
    randomMismatch = { iteration: i, key: 'ownershipTotal', actual: total, expected: 1 };
  }
  if (randomMismatch) break;
}
if (randomMismatch) fail('10,000 randomized formula and ownership checks', JSON.stringify(randomMismatch));
else pass('10,000 randomized formula and ownership checks');

truthy('Service-worker cache version was bumped to v16', serviceWorker.includes("founder-calc-v16"));

console.log(`\nSummary: ${failures} failure(s).`);
if (failures > 0) process.exit(1);
