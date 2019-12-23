
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
      <button :disabled="!diffCreated"
        id="downloadDiffBtn"
        v-on:click.prevent="downloadDiff()">Download Diff</button>
    </div>

    <div id="diff">
      <div v-for="diff in diffs" :key="diff.oldFileName">
        Old: {{ diff.oldFileName }} New: {{ diff.newFileName }}
        <code-diff :old-string="diff.oldText"
                  :new-string="diff.newText"
                  :context="1000"
                  :outputFormat="`side-by-side`"/>
      </div>
    </div>
  </div>
</template>
<script>
/* TODO
  - CSS
  - download diffs button
*/
import CodeDiff from 'vue-code-diff';
import * as EditDistance from 'levenshtein-edit-distance';
import * as Zip from '../lib/zip';

const { zip } = Zip;

zip.workerScripts = {
  deflater: ['../lib/z-worker.js', '../lib/deflate.js'],
  inflater: ['../lib/z-worker.js', '../lib/inflate.js'],
};

export default {
  name: 'cqm-diff',
  components: { CodeDiff },
  data() {
    return {
      oldMeasure: '',
      newMeasure: '',
      diffs: [],
      diffCreated: false,
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
      return !!measurePackage;
    },
    validatePackages() {
      return this.packageIsValid(this.oldMeasure) && this.packageIsValid(this.newMeasure);
    },
    reorderNewLibrary(oldLibrary, newLibrary) {
      const oldSplit = oldLibrary.split('\n\n');
      const newSplit = newLibrary.split('\n\n');
      const paragraphMap = this.mapByEditDistance(oldSplit, newSplit);
      return this.rebuildFromMapping(oldSplit, newSplit, paragraphMap);
    },
    rebuildFromMapping(oldStrings, newStrings, mapping) {
      const reordered = [];
      for (let i = 0; i < oldStrings.length; i += 1) {
        const oldString = oldStrings[i];
        reordered.push(mapping[oldString]);
      }
      return reordered.join('\n\n');
    },
    mapByEditDistance(oldStrings, newStrings) {
      const distMap = {};
      for (let i = 0; i < oldStrings.length; i += 1) {
        const oldString = oldStrings[i];
        let minDist = oldString.length;
        for (let j = 0; j < newStrings.length; j += 1) {
          const newString = newStrings[j];
          const dist = EditDistance(oldString, newString);
          if (dist < minDist) {
            minDist = dist;
            distMap[oldString] = newString;
          }
        }
      }
      return distMap;
    },
    calculateDiff() {
      const libraryMap = this.createLibraryMap();
      console.log(libraryMap);
      const oldFileNames = Object.keys(this.oldMeasure);
      for (let i = 0; i < oldFileNames.length; i += 1) {
        const oldFileName = oldFileNames[i];
        const oldText = this.oldMeasure[oldFileName];
        const newFileName = libraryMap[oldFileName];
        const newText = this.newMeasure[newFileName];
        this.diffs.push({
          oldFileName,
          newFileName,
          oldText,
          newText: this.reorderNewLibrary(oldText, newText),
        });
      }
    },
    createLibraryMap() {
      // use edit distance to determine which libraries from oldMeasure map to which in new
      const oldFileNames = Object.keys(this.oldMeasure);
      const newFileNames = Object.keys(this.newMeasure);

      return this.mapByEditDistance(oldFileNames, newFileNames);
    },
    createDiff() {
      if (!this.validatePackages()) {
        this.diff = 'invalid packages';
      } else {
        this.calculateDiff();
        // this.diffCreated = true;
        this.diffCreated = false; // currently disabled
      }
    },
    downloadDiff() {
      this.$htmlToPaper('diff');
    },
  },
};
</script>
