const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadLevels() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'levels.js'), 'utf8');
  const context = {
    console,
    Math,
    globalThis: {},
    localStorage: {
      _store: Object.create(null),
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null;
      },
      setItem(key, value) {
        this._store[key] = String(value);
      },
      removeItem(key) {
        delete this._store[key];
      }
    }
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.globalThis.DenkmalLevels;
}

const levels = loadLevels();

assert.ok(levels, 'DenkmalLevels should be exposed globally');
assert.equal(levels.levels[1].gates.length, 4, 'Level 1 should have four gates');
assert.equal(levels.levels[2].gates.length, 1, 'Level 2 should have one gate');
assert.ok(levels.slots.length > 0, 'Maze Level should generate tower slots');
assert.equal(levels.unlocked, false, 'Level 2 should start locked');

levels.unlock();
assert.equal(levels.unlocked, true, 'unlock() should persist the Level 2 unlock state');

const slot = levels.slots[0];
assert.ok(slot && levels.nearestSlot(slot), 'A valid slot should resolve to itself');
assert.equal(levels.nearestSlot({ x: 10000, y: 10000 }), null, 'Far-away points should not resolve to a slot');

const enemy = { x: levels.levels[2].gates[0].x, y: levels.levels[2].gates[0].y, waypoint: 0, speed: 180 };
const originalX = enemy.x;
levels.advance(enemy, 0.5);
assert.ok(enemy.x !== originalX || enemy.y !== levels.levels[2].gates[0].y, 'advance() should move the enemy along the maze path');

console.log('All level checks passed.');
