
<template>
  <div id="app">
    <section class="hero is-info">
      <div class="hero-body">
        <div>
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

    <div>
      <div class="columns">
        <div class="column is-one-third">
          <b-field class="file">
              <b-upload v-model="oldMeasureFile">
                <a class="button is-info">
                  <b-icon icon="upload"></b-icon>
                  <span>Upload Old Measure Zip</span>
                </a>
              </b-upload>
              <div class="file-name" v-if="oldMeasureFile">
                {{ oldMeasureFile.name }}
              </div>
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
              <div class="file-name" v-if="newMeasureFile">
                {{ newMeasureFile.name }}
              </div>
          </b-field>
        </div>
        <div class="column is-one-sixth">
          <b-button :disabled="!filesSelected"
            id="createDiffBtn"
            class="is-primary"
          v-on:click.prevent="createDiff()">Create Diff
        </b-button>
        </div>
        <div class="column is-one-sixth">
          <b-switch v-model="reorder"
                  true-value="Auto-Reorder New Measure CQL"
                  false-value="Do not reorder New Measure CQL">
                  {{ reorder }}
          </b-switch>
        </div>
        <!-- <b-button :disabled="!diffCreated"
          class="primary"
          id="downloadDiffBtn"
          v-on:click.prevent="downloadDiff()">Download Diff
          </b-button> -->
        </div>
        <diff v-for="diff in diffs"
              v-bind:key="diff.oldFileName"
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
 - Handle single CQL files in addition to zip files
 - html export
*/

import * as EditDistance from 'levenshtein-edit-distance';
import * as Zip from '../public/lib/zip';
import Diff from '@/components/Diff.vue';

const { zip } = Zip;

zip.workerScripts = {
  deflater: ['../../z-worker.js', '../../deflate.js'],
  inflater: ['../../lib/z-worker.js', '../../lib/inflate.js'],
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
      reorder: 'Auto-Reorder New Measure CQL',
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
      const promises = [];
      zip.createReader(new zip.BlobReader(blob), (reader) => {
        reader.getEntries((entries) => {
          if (entries.length) {
            for (let i = 0; i < entries.length; i += 1) {
              promises.push(new Promise(() => {
                const { filename } = entries[i];
                // Only process cql files.
                if (filename.match(/\.cql$/)) {
                  entries[i].getData(new zip.TextWriter(), (text) => {
                    measure[filename] = text;
                    // eslint-disable-next-line no-console
                    console.log(`${filename} complete.`);
                  }, (current, total) => {
                    // eslint-disable-next-line no-console
                    console.info(`${filename}: ${current}/${total}`);
                  });
                }
              }));
            }
          }
        });
      }, (error) => {
        // eslint-disable-next-line no-console
        console.log(`Error reading zip: ${error.message}`);
      });
      Promise.all(promises);
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
      const usedNewStrings = {};
      for (let i = 0; i < newStrings.length; i += 1) {
        const newString = newStrings[i];
        usedNewStrings[newString] = false;
      }
      for (let i = 0; i < oldStrings.length; i += 1) {
        const oldString = oldStrings[i];
        if (mapping[oldString]) {
          reordered.push(mapping[oldString]);
          usedNewStrings[mapping[oldString]] = true;
        }
      }
      for (let i = 0; i < newStrings.length; i += 1) {
        const newString = newStrings[i];
        if (!usedNewStrings[newString]) {
          reordered.push(newString);
        }
      }
      return reordered.join('\n\n');
    },
    mapByEditDistance(oldStrings, newStrings) {
      const dists = {};
      // calculate the distance from each oldString to every newString
      for (let i = 0; i < oldStrings.length; i += 1) {
        const oldString = oldStrings[i];
        dists[oldString] = [];
        for (let j = 0; j < newStrings.length; j += 1) {
          const newString = newStrings[j];
          const dist = EditDistance(oldString, newString);
          dists[oldString].push({ dist, newString });
        }
        dists[oldString].sort((a, b) => a.dist - b.dist);
      }
      // eslint-disable-next-line arrow-body-style
      const oldStringsToMinDists = Object.keys(dists).map((key) => {
        return { key, dist: dists[key][0].dist };
      });
      oldStringsToMinDists.sort((a, b) => a.dist - b.dist);
      const oldStringsInOrder = oldStringsToMinDists.map(s => s.key);
      // set the matches from min distance and dont reuse newStrings
      // match each oldString to its corresponding newString
      const matches = {};
      const newStringsAlreadyMatched = {};
      oldStringsInOrder.forEach((oldString) => {
        const match = dists[oldString][0].newString;
        if (!newStringsAlreadyMatched[match]) {
          matches[oldString] = match;
          newStringsAlreadyMatched[match] = true;
        } else {
          // If there's an extra paragraph in the old measure, don't match it with anything
          matches[oldString] = null;
        }
      });
      return matches;
    },
    calculateDiff() {
      this.diffs = [];
      const libraryMap = this.createLibraryMap();
      const oldFileNames = Object.keys(this.oldMeasure);
      for (let i = 0; i < oldFileNames.length; i += 1) {
        const oldFileName = oldFileNames[i];
        // Ignore mac temp files
        if (!oldFileName.match(/MACOSX/)) {
          let oldText = this.oldMeasure[oldFileName];
          const newFileName = libraryMap[oldFileName];
          let newText = this.newMeasure[newFileName];

          // Get rid of carriage returns, some measures have them some don't
          oldText = oldText.replace(/\r/g, '');
          newText = newText.replace(/\r/g, '');
          // Replace tabs with 2 spaces due to inconsistencies between 2019/2020
          // 2019 uses 2 tab indentation, 2020 uses 2 spaces followed by a tab
          oldText = oldText.replace(/\t/g, '  ');
          newText = newText.replace(/\t/g, '  ');

          if (this.reorder === 'Auto-Reorder New Measure CQL') {
            newText = this.reorderNewLibrary(oldText, newText);
          }

          this.diffs.push({
            oldFileName,
            newFileName,
            oldText,
            newText,
          });
        }
      }
    },
    createLibraryMap() {
      // use edit distance to determine which libraries from oldMeasure map to which in new
      // Do not use temp files from the zip library as keys
      const oldFileNames = Object.keys(this.oldMeasure).filter(fn => !fn.match('MACOSX'));
      const newFileNames = Object.keys(this.newMeasure).filter(fn => !fn.match('MACOSX'));

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
