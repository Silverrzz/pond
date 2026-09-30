import { onUnmounted, shallowRef, watch } from 'vue';

export function useSearchOutput(game) {
  const output = shallowRef({ state: null, searches: {}, names: {}, ply: 0 });
  let timer;
  watch(
    [
      game.state,
      game.liveSearches,
      game.evaluations,
      game.searches,
      game.names,
      game.ply,
      game.analysis
    ],
    () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        output.value = {
          state: game.state.value
            ? {
                ...game.state.value,
                ...(game.analysis.value.enabled
                  ? {
                      moves: game.analysis.value.history.line
                        .slice(1)
                        .map((id) => game.analysis.value.history.nodes[id].record.uci)
                    }
                  : {}),
                searches: game.liveSearches.value,
                analysisActive: game.analysis.value.enabled,
                evaluations: game.analysis.value.enabled
                  ? game.analysis.value.evaluations
                  : game.evaluations.value
              }
            : null,
          searches: game.searches.value,
          names: game.names.value,
          ply: game.ply.value
        };
      }, 80);
    },
    { immediate: true }
  );
  onUnmounted(() => clearTimeout(timer));
  return output;
}
