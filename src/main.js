import {createApp} from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import {loadFonts} from './plugins/webfontloader'
import axios from "axios";
import router from "./routers"
import VueCookies from "vue-cookies"
import VueDatePicker from "@vuepic/vue-datepicker"
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@vuepic/vue-datepicker/dist/main.css'


loadFonts()
const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(VueVirtualScroller)
app.component('VueDatePicker', VueDatePicker)
app.use(VueCookies, {

})

app.config.globalProperties.$axios = axios
axios.defaults.withCredentials = true
app.mount('#app')