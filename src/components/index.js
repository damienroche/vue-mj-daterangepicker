import Vue from 'vue'
import DateRangePicker from './DateRangePicker.vue'

const components = {
  DateRangePicker
}

Object.keys(components).forEach(name => {
  Vue.component(name, components[name])
})

export default components
