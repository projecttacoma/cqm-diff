
<template>
  <div id="app">
    <section class="hero is-info">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            cqm-diff
          </h1>
          <h2 class="subtitle">
            Upload two versions of an eCQM Measure Authoring Tool (MAT)
            package (.zip files) and click "Create Diff" to see the changes
            between their CQL files. </h2>
        </div>
      </div>
    </section>
    <div class="navbar-brand">
    </div>

    <div class="container">
      <div class="columns">
        <div class="column is-one-third">
          <b-field class="file">
              <b-upload v-model="oldMeasureFile">
                <a class="button is-info">
                  <b-icon icon="upload"></b-icon>
                  <span>Upload Old Measure Zip</span>
                </a>
              </b-upload>
              <span class="file-name" v-if="oldMeasureFile">
                {{ oldMeasureFile.name }}
              </span>
          </b-field>
        </div>
        <div class="column is-one-third">
          <b-field class="file">
              <b-upload v-model="newMeasureFile">
                <a class="button is-info">
                  <b-icon icon="upload"></b-icon>
                  <span>Upload New Measure Zip</span>
                </a>
              </b-upload>
              <span class="file-name" v-if="newMeasureFile">
                {{ newMeasureFile.name }}
              </span>
          </b-field>
        </div>
          <div class="column is-one-third">
            <b-button :disabled="!filesSelected"
              id="createDiffBtn"
              class="is-primary"
              v-on:click.prevent="createDiff()">Create Diff
            </b-button>
          <!-- <b-button :disabled="!diffCreated"
            class="primary"
            id="downloadDiffBtn"
            v-on:click.prevent="downloadDiff()">Download Diff
            </b-button> -->
          </div>
        </div>
        <diff v-for="diff in diffs"
              v-bind:key="diff"
              v-bind:oldFileName="diff.oldFileName"
              v-bind:newFileName="diff.newFileName"
              v-bind:oldText="diff.oldText"
              v-bind:newText="diff.newText">
        </diff>
      </div>
    </div>
</template>
<script>
/* TODO
  - CSS
  - download diffs button
*/
import * as EditDistance from 'levenshtein-edit-distance';
import * as Zip from '../lib/zip';
import Diff from '@/components/Diff.vue';

const { zip } = Zip;

zip.workerScripts = {
  deflater: ['../lib/z-worker.js', '../lib/deflate.js'],
  inflater: ['../lib/z-worker.js', '../lib/inflate.js'],
};

export default {
  name: 'cqm-diff',
  components: {
    Diff,
  },
  data() {
    return {
      oldMeasureFile: null,
      newMeasureFile: null,
      diffs: [],
      diffCreated: false,
    };
  },
  computed: {
    filesSelected() {
      return !!this.oldMeasure && !!this.newMeasure;
    },
    oldMeasure() {
      if (this.oldMeasureFile) {
        return this.zipUpload(this.oldMeasureFile);
      }
      return null;
    },
    newMeasure() {
      if (this.newMeasureFile) {
        return this.zipUpload(this.newMeasureFile);
      }
      return null;
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
                    // eslint-disable-next-line no-console
                    console.log(`${filename} complete.`);
                  });
                }, (current, total) => {
                  // eslint-disable-next-line no-console
                  console.info(`${filename}: ${current}/${total}`);
                });
              }
            }
          }
        });
      }, (error) => {
        // eslint-disable-next-line no-console
        console.log(`Error reading zip: ${error}`);
      });
      return measure;
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
