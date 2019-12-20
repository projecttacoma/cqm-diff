
<template>
  <div id="app">
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        MITRE CQM-DIFF
      </div>
    </nav>

    <div class="container">
      <div class="column">
        <div class="large-12 medium-12 small-12 cell">
          <label>Old Measure Package
            <input type="file" id="measure-old" ref="measure-old" v-on:change="oldMeasureUpload()"/>
          </label>
        </div>
      </div>
      <div class="column">
        <div class="large-12 medium-12 small-12 cell">
          <label>New Measure Package
            <input type="file" id="measure-new" ref="measure-new" v-on:change="newMeasureUpload()"/>
          </label>
        </div>
      </div>
      <button v-on:click="submitFiles()">Create Diff</button>
    </div>
  </div>
</template>

<script>
/* TODO
  - CSS
  - Input validation for file uploads
  - Unzip and parse libraries into separate {filename, string} tuples
  - match filenames based on edit distance and create diff of each
  - port diff from python to node
  - integrate diff2html into web app
  - display diffs on page
*/

export default {
  name: 'app',
  data() {
    return {
      oldMeasure: '',
      newMeasure: '',
    };
  },
  methods: {
    oldMeasureUpload() {
      this.oldMeasure = this.$refs.measureOld.files;
    },
    newMeasureUpload() {
      this.oldMeasure = this.$refs.measureNew.files;
    },
  },
};
</script>
