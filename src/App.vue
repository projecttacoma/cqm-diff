
<template>
  <div id="app">
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        MITRE CQM-DIFF
      </div>
    </nav>

    <div class="container">
      <div class="large-12 medium-12 small-12 cell">
        <label>Old Measure Package
          <input type="file" id="measure-old" ref="measureOld" v-on:change="oldMeasureUpload()"/>
        </label>
      </div>

      <div class="large-12 medium-12 small-12 cell">
        <label>New Measure Package
          <input type="file" id="measure-new" ref="measureNew" v-on:change="newMeasureUpload()"/>
        </label>
      </div>

      <button :disabled="!filesSelected"
        id="createDiffBtn"
        v-on:click.prevent="createDiff()">Create Diff</button>
    </div>

    <div>
      {{ diff }}
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
      diff: '',
    };
  },
  computed: {
    filesSelected() {
      return !!this.oldMeasure && !!this.newMeasure;
    },
  },
  methods: {
    oldMeasureUpload() {
      this.oldMeasure = this.$refs.measureOld.files;
    },
    newMeasureUpload() {
      this.newMeasure = this.$refs.measureNew.files;
    },
    packageIsValid(measurePackage) {
      return !!measurePackage;
    },
    validatePackages() {
      return this.packageIsValid(this.oldMeasure) && this.packageIsValid(this.newMeasure);
    },
    calculateDiff() {
      this.diff = 'diff created';
    },
    createDiff() {
      if (!this.validatePackages()) {
        this.diff = 'invalid packages';
      } else {
        this.calculateDiff();
      }
    },
  },
};
</script>
