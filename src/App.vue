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
            package (.zip files or .cql files) and click "Create Diff" to see
            the changes between their CQL files. </h2>
          Measure packages submitted are processed completely in the browser and
            are not uploaded to github.io or to any external/cloud storage.
          <a href="https://github.com/projecttacoma/cqm-diff">
            <b-button size="is-small">
              <font-awesome-icon :icon="['fab', 'github']" />
              Source
            </b-button>
          </a>
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
                  <span>Upload Old Measure (.zip|.cql)</span>
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
                  <span>Upload New Measure (.zip|.cql)</span>
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
import * as EditDistance from 'levenshtein-edit-distance';
import * as Path from 'path';
import Diff from '@/components/Diff.vue';
import * as Zip from '../public/lib/zip';

const { zip } = Zip;

zip.workerScripts = {
  deflater: [Path.resolve(`${window.location.pathname}/lib/z-worker.js`), Path.resolve(`${window.location.pathname}/lib/deflate.js`)],
  inflater: [Path.resolve(`${window.location.pathname}/lib/z-worker.js`), Path.resolve(`${window.location.pathname}/lib/inflate.js`)],
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
        if (this.oldMeasureFile.name !== undefined
          && this.oldMeasureFile.name.match(/\.cql$/)) {
          return this.cqlUpload(this.oldMeasureFile);
        }
        return this.zipUpload(this.oldMeasureFile);
      }
      return null;
    },
    newMeasure() {
      if (this.newMeasureFile) {
        if (this.newMeasureFile.name !== undefined
          && this.newMeasureFile.name.match(/\.cql$/)) {
          return this.cqlUpload(this.newMeasureFile);
        }
        return this.zipUpload(this.newMeasureFile);
      }
      return null;
    },
  },
  methods: {
    cqlUpload(blob) {
      const measure = {};
      const reader = new FileReader();
      reader.onload = (fileLoadedEvent) => {
        measure[blob.name] = fileLoadedEvent.target.result;
      };
      reader.readAsText(blob, 'UTF-8');
      return measure;
    },
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
      return Object.keys(this.oldMeasure).length === Object.keys(this.newMeasure).length
        && this.packageIsValid(this.oldMeasure) && this.packageIsValid(this.newMeasure);
    },
    reorderNewLibrary(oldLibrary, newLibrary) {
      const oldLibraryParts = oldLibrary.split('context Patient\n\n');
      const oldLibraryBody = oldLibraryParts[1];

      const newLibraryParts = newLibrary.split('context Patient\n\n');
      const newLibraryHeader = newLibraryParts[0];
      const newLibraryBody = newLibraryParts[1];

      const oldSplit = oldLibraryBody.split('\n\n');
      const newSplit = newLibraryBody.split('\n\n');
      const paragraphMap = this.mapByEditDistance(oldSplit, newSplit);
      const newLibraryOrderedBody = this.rebuildFromMapping(oldSplit, newSplit, paragraphMap);
      return `${newLibraryHeader}context Patient\n\n${newLibraryOrderedBody}`;
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
          /*
            Matching Algorithm:
              1. If we are comparing anything except 2 define statements, just use
              edit distance.
              2. If two define statements, use the weighted sum of the edit
              distance of the define label itself and the whole statement.
          */
          const statementDist = EditDistance(oldString, newString);
          const oldDefine = oldString.match(/define "(.*)":/);
          const newDefine = newString.match(/define "(.*)":/);
          let defineDist = -1;
          if (oldDefine && newDefine
            && oldDefine.length > 1 && newDefine.length > 1) {
            defineDist = EditDistance(oldDefine[1], newDefine[1]);
          }

          let dist = statementDist;

          if (defineDist !== -1) {
            dist = 0.5 * defineDist + 0.5 * statementDist;
          }

          if (defineDist === 0) {
            dist = 0;
          }

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
