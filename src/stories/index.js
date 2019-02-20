import Vue from 'vue';

import { storiesOf } from '@storybook/vue';

storiesOf('DateRangePicker', module)
  .add('Without Prop', () => '<date-range-picker/>');
  // .add('story as a component', () => ({
  //   components: { MyButton },
  //   template: '<my-button :rounded="true">rounded</my-button>'
  // }));
