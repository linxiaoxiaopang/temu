import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

const container = document.createElement('div')
container.style.cssText = 'position:fixed; top:20px; left:20px; background:green; color:white; padding:10px;'
const app = document.createElement('div')
app.id = 'vue-app'
document.body.appendChild(container)
container.appendChild(app)

new Vue({
  render: h => h(App),
}).$mount('#vue-app')
