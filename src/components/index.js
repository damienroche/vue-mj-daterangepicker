import Vue from 'vue'
import SimpleDateRangePicker from './SimpleDateRangePicker.vue'

const components = {
  SimpleDateRangePicker
}

Object.keys(components).forEach(name => {
  Vue.component(name, components[name])
})

export default components
