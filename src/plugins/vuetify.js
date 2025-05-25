// plugins/vuetify.js
import 'vuetify/styles' // ✅ Vuetify CSS
import '@mdi/font/css/materialdesignicons.css' // ✅ MDI 아이콘 CSS

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
    },
})
