const { DuckGame } = require('./rules');
const { readDocument, playSan } = require('./pgn');

class MoveTree {
  constructor(source, document) {
    this.base = new DuckGame({
      variant: source.variant,
      position: source.position,
      blackPosition: source.blackPosition,
      fen: source.initialFen
    });
    this.nodes = [{ id: 0, parent: null, children: [], ply: 0 }];
    this.preferred = new Map();
    let parent = 0;
    const main = [0];
    for (const record of source.records) {
      parent = this.add(parent, record);
      main.push(parent);
    }
    const pending = [];
    const variations = (entries, path) => {
      entries?.forEach((entry, i) => {
        for (const annotation of entry.annotations)
          if (annotation.variation)
            pending.push({ parent: path[i], text: annotation.variation.slice(1, -1) });
      });
    };
    let original = true;
    const entries = document?.entries.filter((entry, i) => {
      original = original && document.moves[i] === source.moves[i];
      return original;
    });
    variations(entries, main);
    for (let i = 0; i < pending.length; i++) {
      const variation = pending[i];
      const game = this.gameAt(variation.parent);
      const entries = readDocument(variation.text).entries;
      const path = [variation.parent];
      for (const entry of entries) {
        playSan(game, entry.move);
        path.push(this.add(path.at(-1), game.records.at(-1)));
      }
      variations(entries, path);
    }
  }

  add(parent, record) {
    const node = this.nodes[parent];
    const existing = node.children.find((id) => this.nodes[id].record.uci === record.uci);
    if (existing !== undefined) return existing;
    if (this.nodes.length >= 20000) throw new Error('The analysis contains too many moves.');
    const id = this.nodes.length;
    this.nodes.push({ id, parent, children: [], ply: node.ply + 1, record: { ...record } });
    node.children.push(id);
    return id;
  }

  path(id) {
    if (!Number.isInteger(id) || !this.nodes[id]) throw new Error('Invalid analysis move.');
    const path = [];
    for (let node = this.nodes[id]; node.parent !== null; node = this.nodes[node.parent])
      path.push(node.id);
    return [0, ...path.reverse()];
  }

  select(id) {
    const path = this.path(id);
    for (let i = 1; i < path.length; i++) this.preferred.set(path[i - 1], path[i]);
  }

  line() {
    const path = [0];
    let node = this.nodes[0];
    while (node.children.length) {
      node = this.nodes[this.preferred.get(node.id) ?? node.children[0]];
      path.push(node.id);
    }
    return path;
  }

  gameAt(id) {
    const game = Object.assign(Object.create(DuckGame.prototype), structuredClone(this.base));
    for (const move of this.path(id).slice(1)) game.playUci(this.nodes[move].record.uci);
    return game;
  }

  movetext() {
    const tokens = [];
    const tasks = this.nodes[0].children.length
      ? [{ id: this.nodes[0].children[0], siblings: true }]
      : [];
    while (tasks.length) {
      const task = tasks.pop();
      if (typeof task === 'string') {
        tokens.push(task);
        continue;
      }
      const node = this.nodes[task.id];
      const move = node.record;
      tokens.push(
        `${move.number}${move.side === 'w' ? '.' : '...'} ${move.san}${move.duck ? ',' + move.duck : ''}`
      );
      if (node.children.length) tasks.push({ id: node.children[0], siblings: true });
      if (task.siblings) {
        const siblings = this.nodes[node.parent].children.slice(1);
        for (const id of siblings.reverse()) tasks.push(')', { id, siblings: false }, '(');
      }
    }
    return tokens;
  }
}

module.exports = { MoveTree };
