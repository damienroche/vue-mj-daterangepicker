import { configure } from '@storybook/vue';

import Vue from 'vue';

// Import your custom components.
import DateRangePicker from 'vue-mj-daterangepicker';
import 'vue-mj-daterangepicker/dist/vue-mj-daterangepicker.css';
import './custom.css'
Vue.use(DateRangePicker)

// Register custom components.
// Vue.component('date-range-picker', DateRangePicker);

function loadStories() {
  // You can require as many stories as you need.
  require('../src/stories');
}

configure(loadStories, module);
