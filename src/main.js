import Vue from 'vue'
import 'normalize.css/normalize.css' // A modern alternative to CSS resets
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App'

import global from '@/global/global.vue'// 引用文件
// register globally

Vue.use(ElementUI)

Vue.component()
Vue.prototype.global = global// 挂载到Vue实例上面
Vue.config.productionTip = false

new Vue({
  el: '#app',
  render: h => h(App)
})
