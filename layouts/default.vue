<template>
  <!-- v-page-drag lives here so every page gets it: dragging with a mouse
       scrolls the page instead of selecting text. -->
  <div v-page-drag class="laviz-app">
    <nuxt />
  </div>
</template>

<script>
import pageDrag from '~/utils/pageDrag';

export default {
  directives: { pageDrag },
  mounted() {},
};
</script>
