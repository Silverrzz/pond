import { onUnmounted, shallowRef, watch } from 'vue';

export function useSearchOutput(game) {
  const output = shallowRef({ state: null, searches: {}, names: {}, ply: 0 });
  let timer;
  watch(
    [game.state, game.liveSearches, game.evaluations, game.searches, game.names, game.ply],
    () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        output.value = {
          state: game.state.value
            ? {
                ...game.state.value,
                searches: game.liveSearches.value,
                evaluations: game.evaluations.value
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
