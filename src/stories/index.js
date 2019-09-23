import Vue from 'vue';

import { storiesOf } from '@storybook/vue';

storiesOf('DateRangePicker', module)
  .add('Default', () => '<date-range-picker/>')
  .add('Input values', () => '<date-range-picker from="2018-04-23T10:26:00.996Z" to="2019-04-23T10:26:00.996Z"/>')
  .add('Active panel', () => ({
    data() {
      return {
        panel: 'week'
      }
    },
    template: '<date-range-picker from="2019-04-15T10:26:00.996Z" to="2019-04-21T10:26:00.996Z" :panel="panel"/>'
  }))
  .add('Custom panels', () => ({
    data() {
      return {
        panels: ['range', 'week']
      }
    },
    template: '<date-range-picker :panels="panels"/>'
  }))
  .add('Custom Theme', () => ({
    data() {
      return {
        theme: {
          primary: '#46C3A3',
          secondary: '#2D3E50',
          ternary: '#93A0BD',
          light: '#ffffff',
          border: '#ccc',
          dark: '#000000',
          hovers: {
            day: '#CCC',
            range: '#e6e6e6'
          }
        }
      }
    },
    template: '<date-range-picker :theme="theme"/>'
  }))
  .add('Locale FR', () => ({
    data() {
      return {
        locale: 'fr'
      }
    },
    template: '<date-range-picker :locale="locale"/>'
  }))
  .add('Locale DE', () => ({
    data() {
      return {
        locale: 'de'
      }
    },
    template: '<date-range-picker :locale="locale"/>'
  }))
  .add('Locale ES', () => ({
    data() {
      return {
        locale: 'es'
      }
    },
    template: '<date-range-picker :locale="locale"/>'
  }))
  .add('Disallow past dates and filtering presets', () => ({
    data() {
      return {
        past: false,
        presets: ['today', 'tomorrow', 'next7days', 'next30days', 'next90days', 'next365days']
      }
    },
    template: '<date-range-picker :past="past" :presets="presets"/>'
  }))
  .add('Disallow bottom controls (use select event)', () => ({
    template: '<date-range-picker :show-controls="false"/>'
  }))
  // .add('Custom Theme', () => '<date-range-picker :theme="theme"/>')
  // .add('story as a component', () => ({
  //   components: { MyButton },
  //   template: '<my-button :rounded="true">rounded</my-button>'
  // }));
