<template>
  <div class="container">
    <div class="columns diff-header">
      <div class="column is-half">
        <span> {{ oldFileName }} </span>
      </div>
      <div class="column is-half">
        <span> {{ newFileName }} </span>
      </div>
    </div>
    <div class="diff-body">
      <code-diff :old-string="oldText"
                :new-string="newText"
                :context="1000"
                :outputFormat="`side-by-side`"/>
    </div>
  </div>
</template>
<script>
import CodeDiff from 'vue-code-diff';

export default {
  props: ['oldFileName', 'newFileName', 'oldText', 'newText'],
  components: {
    CodeDiff,
  },
};
</script>

<style scoped lang="scss">
.diff-header {
  font-family:'Courier New', Courier, monospace
}
</style>
