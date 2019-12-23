
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
  - Unzip and parse libraries into separate {filename, string} tuples
  - match filenames based on edit distance and create diff of each
  - port diff from python to node
  - integrate diff2html into web app
  - display diffs on page
*/
import * as Zip from '../lib/zip';

const { zip } = Zip;

zip.workerScripts = {
  deflater: ['../lib/z-worker.js', '../lib/deflate.js'],
  inflater: ['../lib/z-worker.js', '../lib/inflate.js'],
};

export default {
  name: 'cqm-diff',
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
    zipUpload(blob) {
      const measure = {};
      zip.createReader(new zip.BlobReader(blob), (reader) => {
        reader.getEntries((entries) => {
          if (entries.length) {
            for (let i = 1; i < entries.length; i += 1) {
              const { filename } = entries[i];
              // Only process cql files.
              if (filename.match(/\.cql$/)) {
                entries[i].getData(new zip.TextWriter(), (text) => {
                  measure[filename] = text;
                  reader.close(() => {
                    console.log(`${filename} complete.`);
                  });
                }, (current, total) => {
                  console.info(`${filename}: ${current}/${total}`);
                });
              }
            }
          }
        });
      }, (error) => {
        console.log(`Error reading zip: ${error}`);
      });
      return measure;
    },
    oldMeasureUpload() {
      const [oldMeasureZip] = this.$refs.measureOld.files;
      this.oldMeasure = this.zipUpload(oldMeasureZip);
    },
    newMeasureUpload() {
      const [newMeasureZip] = this.$refs.measureNew.files;
      this.newMeasure = this.zipUpload(newMeasureZip);
    },
    packageIsValid(measurePackage) {
      console.log(measurePackage);
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
