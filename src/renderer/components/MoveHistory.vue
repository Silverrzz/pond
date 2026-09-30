<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { usePond } from '../shared/context';
import { sideName } from '../shared/format';

const { game } = usePond();
const history = ref(null);
const { state, ply, reviewPly, analysis } = game;
const rows = computed(() => {
  const result = [];
  if (analysis.value.enabled && analysis.value.history) {
    const nodes = analysis.value.history.nodes;
    const tasks = nodes[0].children.length
      ? [{ id: nodes[0].children[0], depth: 0, siblings: true }]
      : [];
    while (tasks.length) {
      const { id, depth, siblings } = tasks.pop();
      const node = nodes[id];
      const move = node.record;
      const previous = result.at(-1);
      if (
        !previous ||
        previous.depth !== depth ||
        previous.number !== move.number ||
        move.side !== 'b' ||
        previous.w?.nodeId !== node.parent ||
        previous.b
      )
        result.push({ number: move.number, depth, w: null, b: null });
      result.at(-1)[move.side] = { ...move, ply: node.ply, nodeId: id };
      if (node.children.length) tasks.push({ id: node.children[0], depth, siblings: true });
      if (siblings)
        for (const sibling of nodes[node.parent].children.slice(1).reverse())
          tasks.push({ id: sibling, depth: depth + 1, siblings: false });
    }
    return result;
  }
  for (const [index, move] of (state.value?.records || []).entries()) {
    if (result.at(-1)?.number !== move.number)
      result.push({ number: move.number, w: null, b: null });
    result.at(-1)[move.side] = { ...move, ply: index + 1 };
  }
  return result;
});
watch(
  () => [state.value?.id, state.value?.moves.join(' '), state.value?.phase].join('|'),
  async () => {
    await nextTick();
    if (reviewPly.value === null && history.value)
      history.value.scrollTop = history.value.scrollHeight;
  }
);
watch(
  () => [ply.value, analysis.value.history?.current],
  async () => {
    await nextTick();
    history.value?.querySelector('.move.active')?.scrollIntoView({ block: 'nearest' });
  }
);
const active = (move) =>
  analysis.value.enabled ? move.nodeId === analysis.value.history?.current : move.ply === ply.value;
function select(move) {
  if (analysis.value.enabled) void game.analysisAction('analysisNavigate', { nodeId: move.nodeId });
  else void game.review(move.ply);
}
</script>

<template>
  <div class="history-heading">
    <span></span>
    <span>White</span>
    <span>Black</span>
  </div>
  <div id="history" ref="history" class="history">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="history-row"
      :class="{ 'history-variation': row.depth > 0 }"
      :style="row.depth ? { marginLeft: Math.min(row.depth, 8) * 12 + 'px' } : null"
    >
      <span class="move-number">{{ row.number }}.</span>
      <template v-for="side in ['w', 'b']" :key="side">
        <button
          v-if="row[side]"
          class="move"
          :class="{ active: active(row[side]) }"
          :data-ply="row[side].ply"
          :title="row[side].uci"
          :aria-current="active(row[side])"
          :aria-label="`${row.number}. ${sideName(side)} ${row[side].san}${row[side].duck ? ', duck ' + row[side].duck : ''}`"
          @click="select(row[side])"
        >
          <span>{{ row[side].san }}</span>
          <span v-if="row[side].duck" class="duck-notation">@{{ row[side].duck }}</span>
        </button>
        <span v-else></span>
      </template>
    </div>
  </div>
</template>
