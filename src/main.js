import {createApp} from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import {loadFonts} from './plugins/webfontloader'
import axios from "axios";
import router from "./routers"
import VueCookies from "vue-cookies"
import VueDatePicker from "@vuepic/vue-datepicker"
import '@vuepic/vue-datepicker/dist/main.css'

loadFonts()
const app = createApp(App)
app.use(router)
app.use(vuetify)
app.component('VueDatePicker', VueDatePicker)
app.use(VueCookies, {

})

app.config.globalProperties.$axios = axios
axios.defaults.withCredentials = true
app.mount('#app')