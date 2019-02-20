<template lang="pug">
  .mj-daterange-picker(:style="cssProps")
    .panels-choices
      .panel-button(
        v-for="panel in panels"
        :class="{'is-current': panel === currentPanel}"
        @click="currentPanel = panel"
        ) {{ $legends[locale].panels[panel] }}

    .preset-ranges(v-if="isPresetPicker")
      .preset(v-for="entry in availablePresets")
        input(type="radio" v-model="preset" :id="entry" :value="entry")
        label(:for="entry") {{ $legends[locale].presets[entry] }}

    .mj-calendar(v-if="isMonthsPicker")
      .calendar-header
        .calendar-previous-month.calendar-arrow.calendar-arrow-previous(
          :aria-label="$legends[locale].previousYear"
          @click="changeYear(1)"
        )
          svgicon(icon="arrow-left" width="7.4" height="12")
        .calendar-month-name {{ currentYearName }}
        .calendar-previous-month.calendar-arrow.calendar-arrow-next(
          :aria-label="$legends[locale].nextYear"
          @click="changeYear(-1)")
          svgicon(icon="arrow-right" width="7.4" height="12")

      .calendar-months(v-if="isMonthsPanel")
        .month(
          v-for="month in yearMonths"
          :key="month.date | date('DDMMYYYY')"
          @click="selectMonth(month)"
          :class="monthClasses(month)"
        )
          span {{ month.displayDate }}

      .calendar-quarters(v-if="isQuartersPanel")
        .quarter(
          v-for="(quarter, index) in yearQuarters"
          @click="selectQuarter(quarter)"
          :class="quarterClasses(quarter)"
          )
          .legend {{ $legends[locale].quarter }} {{ ++index }}
          .months
            .month(v-for="month in quarter.months")
              span {{ month.displayDate }}

    .mj-calendar(:class="weekSelector ? 'mj-calendar-week' : 'mj-calendar-days'" v-if="isDaysPicker")
      .calendar-header
        .calendar-previous-month.calendar-arrow.calendar-arrow-previous(
          :aria-label="$legends[locale].previousMonth"
          @click="changeMonth(1)"
        )
          svgicon(icon="arrow-left" width="7.4" height="12")
        .calendar-month-name {{ currentMonthName }}
        .calendar-previous-month.calendar-arrow.calendar-arrow-next(
          :aria-label="$legends[locale].nextMonth"
          @click="changeMonth(-1)")
          svgicon(icon="arrow-right" width="7.4" height="12")
      .calendar-days-name
        .day(v-for="day in firstWeek")
          span {{ day.name }}
      .calendar-days
        .day(
          v-for="day in monthDays"
          :key="day.date | date('DDMMYYYY')"
          :class="dayClasses(day)"
          @click="selectDay(day.date)"
          @mouseover="hoverizeDay(day.date)"
          @mouseleave="hoverRange = []"
        )
          span {{ day.date | date('D') }}
    .mj-daterange-picker-controls
      .mj-daterange-picker-button.mj-daterange-picker-reset(
        @click="reset"
      )
        | {{ resetLegend }}
      .mj-daterange-picker-button.mj-daterange-picker-submit(
        @click="update"
        :class="{'is-disabled': !(values.from && values.to) }"
      )
        | {{ submitLegend }}
</template>

<script lang="ts">
  import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
  import SvgIcon from 'vue-svgicon'
  import './../assets/icons'
  import { dateFilter } from 'vue-date-fns'
  import {
    parse,
    isValid,
    format,
    endOfMonth,
    startOfMonth,
    isBefore,
    isAfter,
    addDays,
    addYears,
    addWeeks,
    addMonths,
    subDays,
    subMonths,
    subWeeks,
    subYears,
    isSameMonth,
    isSameDay,
    isWithinRange,
    startOfDay,
    startOfWeek,
    startOfYear,
    endOfWeek,
    endOfDay
  } from 'date-fns'

  import dictionnaries from '../translations/index.js'

  Vue.prototype.$legends = dictionnaries

  const locales = {
    en: require('date-fns/locale/en'),
    fr: require('date-fns/locale/fr')
  }

  Vue.use(SvgIcon, {
    tagName: 'svgicon'
  })

  @Component({
    filters: {
      date: dateFilter
    }
  })
  export default class extends Vue {
    $legends: any
    currentPanel = null
    panels = [ 'range', 'week', 'month', 'quarter', 'year' ]

    current = null
    weekSelector = false
    monthDays = []
    now = new Date().toISOString()
    values = {
      from: null,
      to: null
    }
    hoverRange = []
    preset = 'custom'

    @Prop({
      type: String,
      default: 'en'
    }) locale

    @Prop({
      type: String,
      default: null
    }) from

    @Prop({
      type: String,
      default: null
    }) to

    @Prop({
      type: String,
      default: null
    }) begin

    @Prop({
      type: Boolean,
      default: true
    }) past

    @Prop({
      type: Boolean,
      default: true
    }) future

    @Prop({
      type: String,
      default: 'range'
    }) panel

    @Prop({
      type: Object,
      default: () => {
        return {
          primary: '#3297DB',
          secondary: '#2D3E50',
          ternary: '#93A0BD',
          light: '#ffffff',
          dark: '#000000',
          hovers: {
            day: '#CCC',
            range: '#e6e6e6'
          }
        }
      }
    }) theme

    @Prop({
      type: Boolean,
      default: false
    }) dark

    @Prop({
      type: String,
      default: 'auto'
    }) width

    @Prop({
      type: String,
      default: null
    }) resetTitle

    @Prop({
      type: String,
      default: null
    }) submitTitle

    @Prop({
      type: Array,
      default: () => ['today', 'yesterday', 'last7days', 'last30days', 'last90days', 'last365days', 'forever', 'custom']
    }) presets

    @Watch('currentPanel', { immediate: true })
    switchMode(panel) {
      this.weekSelector = panel === 'range' ? false : true
      this.updateCalendar()
    }

    @Watch('preset')
    affectPreset(preset) {
      switch (preset) {
        case 'custom':
          this.values = { from: null, to: null }
          break
        case 'today':
          this.values = { from: startOfDay(this.now), to: this.now }
          break
        case 'yesterday':
          this.values = { from: startOfDay(subDays(this.now, 1)), to: endOfDay(subDays(this.now, 1)) }
          break
        case 'last7days':
          this.values = { from: startOfDay(subWeeks(this.now, 1)), to: this.now }
          break
        case 'next7days':
          this.values = { to: startOfDay(addWeeks(this.now, 1)), from: this.now }
          break
        case 'last30days':
          this.values = { from: startOfDay(subMonths(this.now, 1)), to: this.now }
          break
        case 'next30days':
          this.values = { to: startOfDay(addMonths(this.now, 1)), from: this.now }
          break
        case 'last90days':
          this.values = { from: startOfDay(subMonths(this.now, 3)), to: this.now }
          break
        case 'next90days':
          this.values = { to: startOfDay(addMonths(this.now, 3)), from: this.now }
          break
        case 'last365days':
          this.values = { from: startOfDay(subYears(this.now, 1)), to: this.now }
          break
        case 'next365days':
          this.values = { to: startOfDay(addYears(this.now, 1)), from: this.now }
          break
        case 'forever':
          this.values = { from: this.begin, to: this.now }
          break
      }
    }

    get availablePresets() {
      const index = this.presets.indexOf('forever')
      if (!this.begin && index > -1 ) {
        this.presets.splice(index, 1)
      }
      return this.presets
    }

    get resetLegend() {
      return this.resetTitle ? this.resetTitle : this.$legends[this.locale].reset
    }

    get submitLegend() {
      return this.submitTitle ? this.submitTitle : this.$legends[this.locale].submit
    }

    get firstWeek() {
      const days = this.monthDays.slice(0, 7)
      const week = []
      for (const day of days) {
        week.push({
          name: format(day.date, 'dd', { locale: locales[this.locale] })
        })
      }
      return week
    }

    get cssProps() {
      return {
        '--default-width': this.width,
        '--primary-color': this.theme.primary,
        '--hover-day-color': this.theme.hovers.day,
        '--hover-range-color': this.theme.hovers.range,
        '--secondary-color': this.theme.secondary,
        '--ternary-color': this.theme.ternary,
        '--normal-color': !this.dark ? this.theme.light : this.theme.dark,
        '--contrast-color': this.dark ? this.theme.light : this.theme.dark
      }
    }

    get yearMonths() {
      const months = []
      let month = startOfYear(this.current)
      while (months.length !== 12) {
        months.push({ date: month, displayDate: format(month, 'MMMM', { locale: locales[this.locale] }) })
        month = addMonths(month, 1)
      }
      return months
    }

    get yearQuarters() {
      const quarters = []
      for (const [index, month] of this.yearMonths.entries()) {
        if (index % 3 === 0) {
          quarters.push({
            months: [this.yearMonths[index], this.yearMonths[index + 1], this.yearMonths[index + 2]],
            range: {
              start: startOfDay(startOfMonth(this.yearMonths[index].date)),
              end: endOfDay(endOfMonth(this.yearMonths[index + 2].date))
            }
          })
        }
      }
      return quarters
    }

    get currentMonthName() {
      return format(this.current, 'MMMM YYYY', { locale: locales[this.locale] })
    }

    get currentYearName() {
      return format(this.current, 'YYYY', { locale: locales[this.locale] })
    }

    get isPresetPicker(): boolean {
      return this.currentPanel === 'range'
    }

    get isDaysPicker(): boolean {
      return this.currentPanel === 'range' || this.currentPanel === 'week'
    }

    get isMonthsPicker(): boolean {
      return this.currentPanel === 'month' || this.currentPanel === 'quarter'
    }

    get isMonthsPanel(): boolean {
      return this.currentPanel === 'month'
    }

    get isQuartersPanel(): boolean {
      return this.currentPanel === 'quarter'
    }

    created() {
      // Parse Inputs
      Object.keys(this.values).forEach((value) => {
        this.values[value] = isValid(parse(this[value])) ? this[value] : null
      })

      // Todo ? If from or to is null, or from is after to, both are null

      // Display current month or "to" month
      this.current = this.values.to ? this.values.to : this.now

      // Update Calendar
      this.updateCalendar()

      // Set current panel
      this.currentPanel = this.panel || this.panels[0]
    }

    reset() {
      this.values = {
        to: null,
        from: null
      }
      this.preset = null
      this.$emit('reset', { to: null, from: null })
    }

    update() {
      if (!this.values.from || !this.values.to) {
        return
      }
      this.$emit('update', {
        to: format(endOfDay(this.values.to), 'YYYY-MM-DDTHH:mm:ss.SSSZ'),
        from: format(startOfDay(this.values.from), 'YYYY-MM-DDTHH:mm:ss.SSSZ'),
        panel: this.currentPanel
      })
    }

    changeMonth(diff: number) {
      this.current = subMonths(this.current, diff)
      this.updateCalendar()
    }

    changeYear(diff: number) {
      this.current = subYears(this.current, diff)
      this.updateCalendar()
    }

    selectDay(date) {
      if (this.weekSelector) {
        this.values.from = startOfWeek(date, { weekStartsOn: 1 })
        this.values.to = endOfWeek(date, { weekStartsOn: 1 })
        return
      }
      if ((this.values.from && this.values.to) || (!this.values.from && !this.values.to)) {
        this.values.from = date
        this.values.to = null
      } else if (this.values.from && !this.values.to) {
        if (isBefore(date, this.values.from)) {
          this.values.from = date
        } else {
          this.values.to = date
          this.hoverRange = []
        }
      }
      this.preset = 'custom'
    }

    selectQuarter(quarter) {
      this.values.from = startOfDay(startOfMonth(quarter.range.start))
      this.values.to = endOfMonth(quarter.range.end)
      this.current = this.values.to
    }

    selectMonth(month) {
      this.values.from = startOfMonth(month.date)
      this.values.to = endOfMonth(month.date)
      this.current = this.values.to
    }

    hoverizeDay(date) {
      if (!this.weekSelector && (!(this.values.from && !this.values.to) || (isBefore(date, this.values.from)))) {
        this.hoverRange = []
        return
      }
      if (this.weekSelector) {
        this.hoverRange = [startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 })]
      } else {
        this.hoverRange = [this.values.from, date]
      }
    }

    updateCalendar() {
      const days = []

      const lastDayOfMonth = endOfMonth(this.current)
      const firstDayOfMonth = startOfMonth(this.current)
      const nbDaysLastMonth = (+format(firstDayOfMonth, 'd') - 1) % 7

      let day = subDays(firstDayOfMonth, nbDaysLastMonth)

      while (isBefore(day, lastDayOfMonth) || days.length % 7 > 0) {
        days.push({
          date: day,
          selectable:
            this.future && isAfter(day, this.now) ? true : false ||
            this.past && isBefore(day, this.now) ? true : false ||
            isSameDay(day, this.now),
          currentMonth: isSameMonth(this.current, day)
        })
        day = addDays(day, 1)
      }
      this.monthDays = days
    }

    dayClasses(day) {
      const classes = []

      if (day.currentMonth) {
        classes.push('is-current-month')
      }
      if (this.values.from && this.values.to && isWithinRange(day.date, this.values.from, this.values.to) ) {
        classes.push('is-selected')
      }
      if (!day.selectable) {
        classes.push('is-disabled')
      }
      if (isSameDay(day.date, this.now)) {
        classes.push('is-today')
      }
      if (
        (!this.values.to && isSameDay(day.date, this.values.from)) ||
        (this.values.to && !this.values.from &&
        isSameDay(day.date, this.values.from) && isSameDay(day.date, this.values.to)) ||
        (this.values.to && this.values.from && isSameDay(day.date, this.values.from))) {
        classes.push('is-first-range')
        classes.push('is-edge-range')
      }
      if (this.values.to && isSameDay(day.date, this.values.to)) {
        classes.push('is-last-range')
        classes.push('is-edge-range')
      }

      if (this.hoverRange.length === 2 && isWithinRange(day.date, this.hoverRange[0], this.hoverRange[1])) {
        classes.push('is-in-range')
      }
      return classes
    }

    quarterClasses(quarter) {
      const classes = []
      if (this.values.to && this.values.from) {
        if (isSameDay(this.values.from, quarter.range.start) && isSameDay(this.values.to, quarter.range.end)) {
          classes.push('is-selected')
        }
      }
      return classes
    }

    monthClasses(month) {
      const classes = []
      if (this.values.to && this.values.from && isWithinRange(month.date, this.values.from, this.values.to)) {
        classes.push('is-selected')
      }
      return classes
    }

    startOfDay(day) {
      return startOfDay(day)
    }

    endOfDay(day) {
      return endOfDay(day)
    }

    subDays(day, amount) {
      return subDays(day, amount)
    }

    subMonths(day, amount) {
      return subMonths(day, amount)
    }

    subWeeks(day, amount) {
      return subWeeks(day, amount)
    }

    subYears(day, amount) {
      return subYears(day, amount)
    }
  }
</script>

<style lang="scss">
.mj-daterange-picker  {
  min-width: 400px;
  width: var(--default-width);
  user-select: none;
  border: 1px solid #E6E6E6;
  border-radius: 4px;

  & * {
    box-sizing: border-box;
  }
}

.mj-daterange-picker .panels-choices {
  display: grid;
  grid-gap: 10px 10px;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid #E6E6E6;
  padding: 20px;

  .panel-button {
    font-size: 12px;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    background-color: #F2F4F5;

    &.is-current,
    &:hover {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

.mj-daterange-picker .preset-ranges {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;

  .preset {
    width: 50%;
    font-size: 13px;
    height: 20px;
    padding: 5px 0;
    cursor: pointer;

    * {
      cursor: pointer;
    }
  }
}

.mj-calendar {
  color: var(--contrast-color);
  background-color: var(--normal-color);
  padding: 20px;

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .calendar-month-name {
      flex: 1;
      text-align: center;
      color: var(--secondary-color);
      font-weight: bold;
      font-size: 14px;
    }

    .calendar-arrow {
      fill: var(--secondary-color);
      cursor: pointer;
    }
  }

  .calendar-months {
    margin-top: 20px;
    display: grid;
    grid-gap: 10px 10px;
    grid-template-columns: 1fr 1fr 1fr;

    .month {
      height: 50px;
      padding: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      font-size: 13px;

      &:hover {
        background-color: var(--hover-range-color);
      }

      &.is-selected {
        background-color: var(--primary-color);
        color: white;
      }

      &:not(.is-disabled) {
        cursor: pointer;
      }
    }
  }

  .calendar-quarters {
    margin-top: 20px;

    .quarter {
      display: grid;
      grid-gap: 10px 10px;
      grid-template-columns: 1fr 3fr;
      margin: 10px 0;
      align-items: center;
      font-size: 13px;

      .months {
        display: grid;
        grid-gap: 10px 10px;
        align-items: center;
        grid-template-columns: 1fr 1fr 1fr;
        border: 1px solid #e6e6e6;
        border-radius: 4px;
        height: 50px;
        padding: 10px 30px;

        &:hover {
          background-color: var(--hover-range-color);
        }

        .month {
          text-align: center;
        }
      }

      &.is-selected .months {
        background-color: var(--primary-color);
        color: white;
      }

      &:not(.is-disabled) .months {
        cursor: pointer;
      }
    }
  }

  .calendar-days-name,
  .calendar-days {
    display: flex;
    flex-wrap: wrap;

    .day {
      width: calc(100% / 7);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  .calendar-days-name .day {
    font-size: 11px;
    color: var(--ternary-color);
    height: 30px;
  }

  .calendar-days .day {
    height: 40px;
    font-size: 13px;
    border-top: 2px solid white;
    border-bottom: 2px solid white;

    &:not(.is-current-month) {
      color: var(--ternary-color);
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none;
    }

    &.is-today {
      span {
        color: var(--secondary-color);
        font-weight: bold;
      }
    }

    &.is-in-range {
      background-color: var(--hover-range-color);
    }

    &.is-first-range {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &.is-last-range {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    &.is-edge-range {
      background-color: var(--primary-color);
      color: white;
    }

    &.is-selected {
      background-color: var(--primary-color);
      color: white;
    }

    &:not(.is-disabled) {
      cursor: pointer;
    }
  }
}

.mj-calendar.mj-calendar-days {
  .calendar-days .day {
    &:not(.is-edge-range):hover {
      background-color: var(--hover-day-color);
    }
  }
}

.mj-daterange-picker-controls {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #E6E6E6;
  padding: 20px;

  .mj-daterange-picker-button {
    height: 36px;
    min-width: 150px;
    padding: 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 12px;

    &:not(.is-disabled) {
      cursor: pointer;
    }
  }
}

.mj-daterange-picker-reset {
  border: 1px solid #E6EAED;
}

.mj-daterange-picker-submit {
  background-color: var(--primary-color);
  color: white;

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
