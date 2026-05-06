import { createApp } from 'vue'
import App from './App.vue'
import VueGtag from "vue-gtag"

createApp(App).use(VueGtag, {
  config: { id: "G-JKN4HD3PKN" }
}).mount("#app")

//createApp(App).use().mount("#app")

