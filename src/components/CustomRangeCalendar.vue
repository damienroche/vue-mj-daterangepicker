<template lang="pug">
  .mj-calendar
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
      )
        span {{ day.date | date('D') }}
</template>

<script lang="ts">
  import { Component, Mixins } from 'vue-property-decorator'
  import { dateFilter } from 'vue-date-fns'
  import {
    parse
  } from 'date-fns'

  import Calendar from '@/mixins/Calendar.vue'

  @Component({
    filters: {
      date: dateFilter
    }
  })
  export default class extends Mixins(Calendar) {

  }
</script>
