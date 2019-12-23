
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
import '../lib/z-worker'

const { zip } = Zip;

zip.workerScripts = {
  deflater: ['../lib/z-worker.js', '../lib/deflate.js'],
  inflater: ['../lib/z-worker.js', '../lib/inflate.js']
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
    oldMeasureUpload() {
      const [oldMeasureZip] = this.$refs.measureOld.files;
      // use a BlobReader to read the zip from a Blob object
      zip.createReader(new zip.BlobReader(oldMeasureZip), (reader) => {
        // get all entries from the zip
        reader.getEntries((entries) => {
          console.log(entries);
          if (entries.length) {
            // get first entry content as text
            entries[0].getData(new zip.TextWriter(), (text) => {
              // text contains the entry data as a String
              console.log(text);

              // close the zip reader
              reader.close(() => {
                // onclose callback
              });
            }, (current, total) => {
              console.log(current);
              console.log(total);
              // onprogress callback
            });
          }
        });
      }, (error) => {
        console.log(error);
        // onerror callback
      });

      this.oldMeasure = { oldMeasureZip };
    },
    newMeasureUpload() {
      const [newMeasureZip] = this.$refs.measureNew.files;
      this.newMeasure = { newMeasureZip };
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
