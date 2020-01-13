<template lang="pug">
  .mj-daterange-picker(:style="cssProps")
    .panels-choices(v-if="availablePanels.length > 1")
      .panel-button(
        v-for="panel in availablePanels"
        :class="{'is-current': panel === currentPanel}"
        @click="currentPanel = panel"
        ) {{ $legends[locale].panels[panel] }}

    .preset-ranges(v-if="isPresetPicker && presets.length > 1")
      .preset(v-for="entry in availablePresets")
        input(type="radio" v-model="preset" :id="entry" :value="entry")
        label(:for="entry")
          span.check
          span {{ $legends[locale].presets[entry] }}

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

    .mj-calendar(v-if="isYearPicker")
      .calendar-years
        .year(
          v-for="year in years"
          @click="selectYear(year)"
          :class="yearClasses(year)"
        )
          span {{ year.displayDate }}

    .mj-daterange-picker-controls(v-if="showControls")
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
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isBefore,
  parseISO,
  isSameDay,
  isSameMonth,
  isValid,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns'
import dictionnaries from '../translations/index.js'
import viLocale from 'date-fns/locale/vi'
import enLocale from 'date-fns/locale/en-US'
import frLocale from 'date-fns/locale/fr'
import deLocale from 'date-fns/locale/de'
import esLocale from 'date-fns/locale/es'
import ruLocale from 'date-fns/locale/ru'


Vue.prototype.$legends = dictionnaries

const locales = {
  en: enLocale,
  fr: frLocale,
  de: deLocale,
  es: esLocale,
  ru: ruLocale,
  vi: viLocale,
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

  current = null
  weekSelector = false
  daySelector = false
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
    type: String,
    default: null
  }) allowFrom

  @Prop({
    type: String,
    default: null
  }) allowTo

  @Prop({
    type: Boolean,
    default: true
  }) past

  @Prop({
    type: Boolean,
    default: true
  }) future

  @Prop({
    type: Boolean,
    default: true
  }) showControls

  @Prop({
    type: String,
    default: null
  }) panel

  @Prop({
    type: Number,
    default: 2
  }) yearsCount

  @Prop({
    type: Array,
    default: () => [ 'range', 'week', 'month', 'quarter', 'year']
  }) panels

  @Prop({
    type: Object,
    default: () => {
      return {
        primary: '#3297DB',
        secondary: '#2D3E50',
        ternary: '#93A0BD',
        border: '#e6e6e6',
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
    default: () => [
      'today',
      'yesterday',
      'last7days',
      'last30days',
      'last90days',
      'last365days',
      'forever',
      'custom'
    ]
  }) presets

  @Watch('currentPanel', { immediate: true })
  switchMode(panel) {
    this.weekSelector = panel === 'week' ? true : false
    this.daySelector = panel === 'day' ? true : false
    this.updateCalendar()
    this.$emit('update:panel', panel)
  }

  @Watch('values', { deep: true })
  emitValuesWithSelect(values) {
    if (values.from && values.to) {
      this.$emit('select', {
        to: format(endOfDay(new Date(this.values.to)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        from: format(startOfDay(new Date(this.values.from)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        panel: this.currentPanel
      })
    }
  }

  @Watch('preset')
  affectPreset(preset) {
    this.current = new Date(this.now)
    this.updateCalendar()

    switch (preset) {
      case 'custom':
        this.values = { from: null, to: null }
        break
      case 'today':
        this.values = { from: startOfDay( new Date(this.now)), to:  new Date(this.now) }
        break
      case 'yesterday':
        this.values = { from: startOfDay(subDays( new Date(this.now), 1)), to: endOfDay(subDays( new Date(this.now), 1)) }
        break
      case 'tomorrow':
        this.values = { from: startOfDay(addDays( new Date(this.now), 1)), to: endOfDay(addDays( new Date(this.now), 1)) }
        break
      case 'last7days':
        this.values = { from: startOfDay(subWeeks( new Date(this.now), 1)), to:  new Date(this.now) }
        break
      case 'next7days':
        this.values = { to: startOfDay(addWeeks( new Date(this.now), 1)), from:  new Date(this.now) }
        break
      case 'last30days':
        this.values = { from: startOfDay(subMonths( new Date(this.now), 1)), to:  new Date(this.now) }
        break
      case 'next30days':
        this.values = { to: startOfDay(addMonths( new Date(this.now), 1)), from:  new Date(this.now) }
        break
      case 'last90days':
        this.values = { from: startOfDay(subMonths( new Date(this.now), 3)), to:  new Date(this.now) }
        break
      case 'next90days':
        this.values = { to: startOfDay(addMonths( new Date(this.now), 3)), from:  new Date(this.now) }
        break
      case 'last365days':
        this.values = { from: startOfDay(subYears( new Date(this.now), 1)), to:  new Date(this.now) }
        break
      case 'next365days':
        this.values = { to: startOfDay(addYears( new Date(this.now), 1)), from:  new Date(this.now) }
        break
      case 'forever':
        this.values = { from: this.begin, to:  new Date(this.now) }
        break
    }
  }

  get availablePanels() {
    return this.panels
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
      '--normal-color': this.theme.light,
      '--contrast-color': this.theme.dark,
      '--border-color': this.theme.border
    }
  }

  get yearMonths() {
    const months = []
    let month = startOfYear(new Date(this.current))
    while (months.length !== 12) {
      const isMonthAllowed = this.isRangeAllowed([startOfMonth(month), endOfMonth(month)])

      months.push({
        date: month,
        selectable: isMonthAllowed,
        displayDate: format(month, 'MMMM', { locale: locales[this.locale] })
      })
      month = addMonths(month, 1)
    }
    return months
  }

  get yearQuarters() {
    const quarters = []
    for (const [index, month] of this.yearMonths.entries()) {
      if (index % 3 === 0) {
        const isQuarterAllowed = this.isRangeAllowed(
          [startOfMonth(this.yearMonths[index].date), endOfMonth(this.yearMonths[index + 2].date)]
        )

        quarters.push({
          months: [
            this.yearMonths[index],
            this.yearMonths[index + 1],
            this.yearMonths[index + 2]
          ],
          selectable: isQuarterAllowed,
          range: {
            start: startOfDay(startOfMonth(this.yearMonths[index].date)),
            end: endOfDay(endOfMonth(this.yearMonths[index + 2].date))
          }
        })
      }
    }
    return quarters
  }

  get years() {
    const years = []
    let i: number = this.yearsCount
    let start = this.future ? addYears( new Date(this.now), this.yearsCount) :  new Date(this.now)

    i = +this.future * this.yearsCount + +this.past * this.yearsCount + 1

    while (i !== 0) {
      const isYearAllowed = this.isRangeAllowed([startOfYear(start), endOfYear(start)])

      years.push({
        date: start,
        selectable: isYearAllowed,
        displayDate: format(start, 'yyyy', { locale: locales[this.locale] })
      })
      start = subYears(start, 1)
      i = i - 1
    }

    return years
  }

  get currentMonthName() {
    return format(new Date(this.current), 'MMMM yyyy', { locale: locales[this.locale] })
  }

  get currentYearName() {
    return format(new Date(this.current), 'yyyy', { locale: locales[this.locale] })
  }

  get isPresetPicker(): boolean {
    return this.currentPanel === 'range'
  }

  get isDaysPicker(): boolean {
    return this.currentPanel === 'range' || this.currentPanel === 'week' || this.currentPanel === 'day'
  }

  get isMonthsPicker(): boolean {
    return this.currentPanel === 'month' || this.currentPanel === 'quarter'
  }

  get isYearPicker(): boolean {
    return this.currentPanel === 'year'
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
      this.values[value] = isValid(parseISO(this[value])) ? this[value] : null
    })

    // Todo ? If from or to is null, or from is after to, both are null

    // Display current month or "to" month
    this.current = this.values.to ? this.values.to : this.now

    // Update Calendar
    this.updateCalendar()

    // Set current panel
    this.currentPanel = this.panel || this.availablePanels[0]
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
      const range = this.getAllowedDatesOfRange(
        [startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 })]
      )

      this.values.from = range[0]
      this.values.to = range[range.length - 1]
      return
    }

    if (this.daySelector) {
      this.values.from = startOfDay(date)
      this.values.to = startOfDay(date)
      return
    }

    if (
      (this.values.from && this.values.to) ||
      (!this.values.from && !this.values.to)
    ) {
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

  selectYear(year) {
    this.values.from = startOfYear(year.date)
    this.values.to = endOfYear(year.date)
    this.current = this.values.to
  }

  hoverizeDay(date) {
    if (
      !this.weekSelector &&
      (!(this.values.from && !this.values.to) ||
        isBefore(date, this.values.from))
    ) {
      this.hoverRange = []
      return
    }
    if (this.weekSelector) {
      this.hoverRange = [
        startOfWeek(date, { weekStartsOn: 1 }),
        endOfWeek(date, { weekStartsOn: 1 })
      ]
    } else {
      this.hoverRange = [this.values.from, date]
    }
  }

  updateCalendar() {
    const days = []

    const lastDayOfMonth = endOfMonth(new Date(this.current))
    const firstDayOfMonth = startOfMonth(new Date(this.current))
    const nbDaysLastMonth = (+format(new Date(firstDayOfMonth), 'd') - 1) % 7

    let day = subDays(firstDayOfMonth, nbDaysLastMonth)

    while (isBefore(day, lastDayOfMonth) || days.length % 7 > 0) {
      const isAllowedByFutureAndPast =
        this.future && isAfter(day, new Date(this.now))
          ? true
          : false || (this.past && isBefore(day,  new Date(this.now)))
          ? true
          : false || isSameDay(day,  new Date(this.now))
      const isAllowedByAllowedProps = this.isDateAllowed(day)
      days.push({
        date: day,
        selectable: isAllowedByFutureAndPast && isAllowedByAllowedProps,
        currentMonth: isSameMonth(new Date(this.current), day)
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
    if (
      this.values.from &&
      this.values.to &&
      isWithinInterval(day.date, {start: new Date(this.values.from), end: new Date(this.values.to)})
    ) {
      classes.push('is-selected')
    }
    if (!day.selectable) {
      classes.push('is-disabled')
    }
    if (isSameDay(day.date,  new Date(this.now))) {
      classes.push('is-today')
    }
    if (
      (!this.values.to && isSameDay(day.date, this.values.from)) ||
      (this.values.to &&
        !this.values.from &&
        isSameDay(day.date, this.values.from) &&
        isSameDay(day.date, this.values.to)) ||
      (this.values.to &&
        this.values.from &&
        isSameDay(day.date, this.values.from))
    ) {
      classes.push('is-first-range')
      classes.push('is-edge-range')
    }
    if (this.values.to && isSameDay(day.date, this.values.to)) {
      classes.push('is-last-range')
      classes.push('is-edge-range')
    }

    if (
      this.hoverRange.length === 2 &&
      isWithinInterval(day.date, {start: this.hoverRange[0], end: this.hoverRange[1]})
    ) {
      classes.push('is-in-range')
    }
    return classes
  }

  monthClasses(month) {
    const classes = []
    if (!month.selectable) {
      classes.push('is-disabled')
    }
    if (
      this.values.to &&
      this.values.from &&
      isWithinInterval(month.date, {start: new Date(this.values.from), end: new Date(this.values.to)})
    ) {
      classes.push('is-selected')
    }
    return classes
  }

  quarterClasses(quarter) {
    const classes = []
    if (!quarter.selectable) {
      classes.push('is-disabled')
    }
    if (
      this.values.to &&
      this.values.from &&
      isWithinInterval(quarter.range.start, {start: new Date(this.values.from), end: new Date(this.values.to)}) &&
      isWithinInterval(quarter.range.end, {start: new Date(this.values.from), end: new Date(this.values.to)})
    ) {
      classes.push('is-selected')
    }
    return classes
  }

  yearClasses(year) {
    const classes = []
    if (!year.selectable) {
      classes.push('is-disabled')
    }
    if (this.values.to && this.values.from) {
      if (
        isSameDay(this.values.from, startOfYear(year.date)) &&
        isSameDay(this.values.to, endOfYear(year.date))
      ) {
        classes.push('is-selected')
      }
    }
    return classes
  }

  isDateAllowed(date) {
    let isAllowed = true

    if (this.allowFrom) {
      isAllowed = isAllowed && !isBefore(date, parseISO(this.allowFrom))
    }

    if (this.allowTo) {
      isAllowed = isAllowed && !isAfter(date, parseISO(this.allowTo))
    }

    return isAllowed
  }

  isRangeAllowed([from, to]) {
    return this.isDateAllowed(from) && this.isDateAllowed(to)
  }

  getAllowedDatesOfRange([from, to]) {
    const distance = differenceInDays(to, from)

    return new Array(distance + 1)
      .fill(null)
      .map((_, index) => addDays(from, index))
      .filter(this.isDateAllowed)
  }
}
</script>

<style lang="scss">
.mj-daterange-picker {
  text-align: left;
  min-width: 400px;
  width: var(--default-width);
  user-select: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;

  & * {
    box-sizing: border-box;
  }
}

.mj-daterange-picker .panels-choices {
  display: grid;
  grid-gap: 10px 10px;
  grid-template-columns: repeat(auto-fill, minmax(75px, max-content));
  border-bottom: 1px solid var(--border-color);
  padding: 10px;

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
    background-color: #f2f4f5;

    &.is-current,
    &:hover {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

.mj-daterange-picker .preset-ranges {
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-color);

  .preset {
    width: 50%;
    font-size: 13px;
    height: 20px;
    cursor: pointer;
    position: relative;
    margin: 5px 0;

    input {
      position: absolute;
      opacity: 0;
      height: 0;
      width: 0;

      &:checked ~ label .check {
        background-color: var(--primary-color);

        &::after {
          background-color: transparent;
        }
      }
    }

    label {
      display: inline-flex;
      align-items: center;

      span + span {
        margin-left: 10px;
      }

      .check {
        display: block;
        position: relative;
        height: 20px;
        width: 20px;
        background-color: var(--secondary-color);
        border-radius: 10px;

        &::after {
          content: "";
          position: absolute;
          height: 10px;
          width: 10px;
          left: 50%;
          top: 50%;
          background-color: white;
          border-radius: 100%;
          border: 3px solid white;
          transform: translateX(-50%) translateY(-50%);
        }
      }
    }

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
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 13px;

      &:hover {
        background-color: var(--hover-range-color);
      }

      &.is-disabled {
        cursor: not-allowed;
        opacity: 0.5;
        pointer-events: none;
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
        border: 1px solid var(--border-color);
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

      &.is-disabled .months {
        opacity: 0.5;
      }

      &.is-disabled {
        cursor: not-allowed;
        pointer-events: none;
      }

      &:not(.is-disabled) .months {
        cursor: pointer;
      }
    }
  }

  .calendar-years {
    .year {
      height: 50px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 13px;
      margin: 10px 0;

      &:hover {
        background-color: var(--hover-range-color);
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

      &:not(.is-disabled) {
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
  border-top: 1px solid var(--border-color);
  padding: 20px;

  .mj-daterange-picker-button {
    height: 36px;
    min-width: 50px;
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
  border: 1px solid #e6eaed;
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
