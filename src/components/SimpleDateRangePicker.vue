<template lang="pug">
  div
    .mj-daterange-picker(:style="cssProps")
      .mj-calendar
        .calendar-header
          .calendar-previous-month.calendar-arrow.calendar-arrow-previous(
            :aria-label="legends[locale].previousMonth"
            @click="changeMonth(1)"
          )
            svgicon(icon="arrow-left" width="7.4" height="12")
          .calendar-month-name {{ currentMonthName }}
          .calendar-previous-month.calendar-arrow.calendar-arrow-next(
            :aria-label="legends[locale].nextMonth"
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
          )
            span {{ day.date | date('D') }}
      .mj-daterange-picker-controls
        .mj-daterange-picker-button.mj-daterange-picker-reset(
          @click="reset"
        )
          | {{ legends[locale].reset }}
        .mj-daterange-picker-button.mj-daterange-picker-submit(
          @click="update"
          :class="{'is-disabled': !(values.from && values.to) }"
        )
          | {{ legends[locale].submit }}

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
    subDays,
    subMonths,
    isSameMonth,
    isSameDay,
    isWithinRange,
    startOfDay,
    endOfDay,
    getISODay
  } from 'date-fns'

  import dictionnaries from '../translations/index.js'

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
    legends = dictionnaries
    currentMonth = null
    monthDays = []
    now = new Date().toISOString()
    values = {
      from: null,
      to: null
    }
    hoverRange = []

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
      type: Boolean,
      default: true
    }) past

    @Prop({
      type: Boolean,
      default: true
    }) future

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
        '--primary-color': this.theme.primary,
        '--hover-day-color': this.theme.hovers.day,
        '--hover-range-color': this.theme.hovers.range,
        '--secondary-color': this.theme.secondary,
        '--ternary-color': this.theme.ternary,
        '--normal-color': !this.dark ? this.theme.light : this.theme.dark,
        '--contrast-color': this.dark ? this.theme.light : this.theme.dark
      }
    }

    get currentMonthName() {
      return format(this.currentMonth, 'MMMM YYYY', { locale: locales[this.locale] })
    }

    created() {
      // Parse Inputs
      Object.keys(this.values).forEach((value) => {
        this.values[value] = isValid(parse(this[value])) ? this[value] : null
      })

      // Todo ? If from or to is null, or from is after to, both are null

      // Display current month or "from" month
      this.currentMonth = this.values.to ? this.values.to : new Date().toISOString()
      console.log(this.currentMonth)

      // Update Calendar
      this.updateCalendar()
    }

    reset() {
      this.values = {
        to: null,
        from: null
      }
      this.$emit('reset', { to: null, from: null })
    }

    update() {
      if (!this.values.from || !this.values.to) {
        return
      }
      this.$emit('update', {
        to: format(startOfDay(this.values.to), 'YYYY-MM-DDTHH:mm:ss.SSSZ'),
        from: format(endOfDay(this.values.from), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
      })
    }

    changeMonth(diff: number) {
      this.currentMonth = subMonths(this.currentMonth, diff)
      this.updateCalendar()
    }

    selectDay(date) {
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
    }

    hoverizeDay(date) {
      if (!(this.values.from && !this.values.to) || isBefore(date, this.values.from)) {
        this.hoverRange = []
        return
      }
      this.hoverRange = [this.values.from, date]
    }

    updateCalendar() {
      const days = []

      const lastDayOfMonth = endOfMonth(this.currentMonth)
      const firstDayOfMonth = startOfMonth(this.currentMonth)
      const nbDaysLastMonth = (+format(firstDayOfMonth, 'd') - 1) % 7

      let day = subDays(firstDayOfMonth, nbDaysLastMonth)

      while (isBefore(day, lastDayOfMonth) || days.length % 7 > 0) {
        days.push({
          date: day,
          selectable:
            this.future && isAfter(day, this.now) ? true : false ||
            this.past && isBefore(day, this.now) ? true : false ||
            isSameDay(day, this.now),
          currentMonth: isSameMonth(this.currentMonth, day)
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
  }
</script>

<style lang="scss">
.mj-daterange-picker  {
  min-width: 320px;

  & * {
    box-sizing: border-box;
  }
}

.mj-calendar {
  color: var(--contrast-color);
  background-color: var(--normal-color);

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


  .calendar-days-name,
  .calendar-days {
    display: flex;
    flex-wrap: wrap;

    .day {
      width: calc(100% / 7);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      user-select: none;
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
    margin: 2px 0;

    &:not(.is-current-month) {
      color: var(--ternary-color);
    }

    &.is-selected {
      background-color: var(--primary-color);
      color: white;
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

    &:not(.is-disabled) {
      cursor: pointer;
    }

    &:not(.is-edge-range):hover {
      background-color: var(--hover-day-color);
    }
  }
}

.mj-daterange-picker-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;

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
