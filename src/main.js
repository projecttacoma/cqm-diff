import Vue from 'vue';
import VueHtmlToPaper from 'vue-html-to-paper';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import App from './App.vue';

library.add(faGithub);

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(Buefy);
const options = {
  name: '_blank',
  specs: [
    'fullscreen=yes',
    'titlebar=yes',
    'scrollbars=yes',
  ],
  styles: [
    'assets/googlecode.css',
    'https://cdnjs.cloudflare.com/ajax/libs/diff2html/2.12.1/diff2html.css',
  ],
};

Vue.use(VueHtmlToPaper, options);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
