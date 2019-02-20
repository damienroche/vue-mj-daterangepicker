<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator'
  import {
    format,
    endOfMonth,
    startOfMonth,
    isBefore,
    isAfter,
    addDays,
    subDays,
    subMonths,
    isSameMonth,
    isSameDay
  } from 'date-fns'

  import dictionnaries from '../translations/index.js'

  const locales = {
    en: require('date-fns/locale/en'),
    fr: require('date-fns/locale/fr')
  }

  Vue.use(SvgIcon, {
    tagName: 'svgicon'
  })

  @Component
  export default class extends Vue {
    currentMonth = null
    monthDays = []
    now = new Date().toISOString()
    values = {
      from: null,
      to: null
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

    get currentMonthName() {
      return format(this.currentMonth, 'MMMM YYYY', { locale: locales[this.locale] })
    }

    changeMonth(diff: number) {
      this.currentMonth = subMonths(this.currentMonth, diff)
      this.updateCalendar()
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
  }
</script>
