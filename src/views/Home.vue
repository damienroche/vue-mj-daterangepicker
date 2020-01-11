<template lang="pug">
  div
    div(style="margin: 20px 0;")
      date-range-picker(:to="$route.query.to" :from="$route.query.from" locale="fr" submit-title="Actualiser" :panel="$route.query.panel" begin="2016-02-19T00:00:00.000+01:00" @select="checkUpdate" :show-controls="false" :presets="['custom']" :panels=['range'] :theme="theme")
    div(style="margin: 20px 0;")
      date-range-picker(:to="$route.query.to" :from="$route.query.from" @update="checkUpdate" )
    div(style="margin: 20px 0;")
      button(
        v-for="localeValue in locales"
        :key="localeValue"
        class="button"
        :class="localeValue === locale && 'selected'"
        @click.prevent="() => switchLocation(localeValue)"
      )
        span {{ localeValue.toUpperCase() }}
    div(style="margin: 20px 0;")
      date-range-picker(to="2019-02-19T23:00:00.000Z" from="2019-02-15T23:00:00.000Z" @update="checkUpdate" :locale="locale" allowFrom="")
    div(style="margin: 20px 0;")
      date-range-picker(allowTo="2019-10-19T00:00:00.000Z" allowFrom="2019-10-15T00:00:00.000Z" @update="checkUpdate" :locale="locale")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator'
  import DateRangePicker from '@/components/DateRangePicker.vue'

  @Component({
    components: {
      DateRangePicker
    },
  })
  export default class Home extends Vue {
    theme = {
      primary: '#46C3A3',
      secondary: '#2D3E50',
      ternary: '#93A0BD',
      light: '#ffffff',
      border: '#e6e6e6',
      dark: '#000000',
      hovers: {
        day: '#CCC',
        range: '#e6e6e6'
      }
    }
    locale: string = 'fr'
    locales: string[] = ['en', 'de', 'ru', 'es', 'fr', 'vi']
    checkUpdate(values) {
      this.$router.push({ query: Object.assign({}, this.$route.query, {
        to: values.to,
        from: values.from,
        panel: values.panel
      }) })
    }
    switchLocation(localeValue) {
      this.locale = localeValue
    }
  }
</script>

<style>
.button {
    appearance: none;
    border: 0;
    display: inline-block;
    font-size: 12px;
    font-weight: bold;
    height: 32px;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    background-color: #F2F4F5;
}

.button + .button {
    margin-left: .25em;
}

.button.selected {
    background-color: #3297DB;
    color: #F2F4F5;
}
</style>
