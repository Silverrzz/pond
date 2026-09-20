<script setup>
import DockSplitter from './DockSplitter.vue';
import SearchPane from './SearchPane.vue';

defineProps({ output: { type: Object, required: true } });
</script>

<template>
  <section class="output-panel" aria-label="Engine output">
    <div class="dock-heading"><h2>Engine output</h2></div>
    <div id="game-searches" class="game-searches">
      <SearchPane
        channel="w"
        :state="output.state"
        :search="output.searches.w"
        :name="output.names.w"
      />
      <DockSplitter
        id="engine-splitter"
        orientation="horizontal"
        label="White and black output height"
      />
      <SearchPane
        channel="b"
        :state="output.state"
        :search="output.searches.b"
        :name="output.names.b"
      />
    </div>
  </section>
</template>
