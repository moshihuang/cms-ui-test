import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from './store';

// plugin
import axios from "axios";
import VueAxios from "vue-axios";

import "./sass/app.sass";


new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');