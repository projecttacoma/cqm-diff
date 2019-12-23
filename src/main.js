import Vue from 'vue';
import VueHtmlToPaper from 'vue-html-to-paper';
import Buefy from 'buefy';
import App from './App.vue';
import 'buefy/dist/buefy.css';

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
  render: h => h(App),
}).$mount('#app');
