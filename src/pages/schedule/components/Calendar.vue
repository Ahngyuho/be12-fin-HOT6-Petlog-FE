<script setup>
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { computed, ref, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useScheduleStore } from "../../../stores/useScheduleStore";
import { hexToRgba } from "../../../utils/color";
const x = ref(100);
const y = ref(100);
const dragging = ref(false);
const draggedEvent = ref(null);
const dropTargetDate = ref(null);
const draggedEventId = ref(null);
const ghostX = ref(0);
const ghostY = ref(0);
const ghostWidth = ref(0);
const ghostHeight = ref(0);

let offsetX = 0;
let offsetY = 0;

function startDrag(mouseEvent, scheduleEvent) {
  dragging.value = true;
  draggedEvent.value = scheduleEvent;
  draggedEventId.value = scheduleEvent.idx;

  const rect = mouseEvent.currentTarget.getBoundingClientRect();

  ghostWidth.value = rect.width;
  ghostHeight.value = rect.height;

  offsetX = mouseEvent.clientX - rect.left;
  offsetY = mouseEvent.clientY - rect.top;

  ghostX.value = mouseEvent.clientX - offsetX;
  ghostY.value = mouseEvent.clientY - offsetY;

  // 화면 전체 추적
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", endDrag);

  // 텍스트 선택 방지용
  e.preventDefault();
}

function onMouseMove(mouseEvent) {
  if (!dragging.value) return;

  ghostX.value = mouseEvent.clientX - offsetX;
  ghostY.value = mouseEvent.clientY - offsetY;
}

function endDrag(mouseEvent) {
  const original = scheduleStore.plans.find(
    (plan) => plan.idx === draggedEventId.value,
  );

  if (draggedEvent.value && dropTargetDate.value) {
    const oldStart = new Date(original.startAt);
    const oldEnd = new Date(original.endAt);

    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(dropTargetDate.value);
    newStart.setHours(
      oldStart.getHours(),
      oldStart.getMinutes(),
      oldStart.getSeconds(),
      oldStart.getMilliseconds(),
    );

    const newEnd = new Date(newStart.getTime() + duration);

    original.startAt = newStart.toISOString();
    original.endAt = newEnd.toISOString();

    console.log(original.startAt);
    console.log(original.endAt);
  }

  console.log(scheduleStore.plans);

  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", endDrag);

  dragging.value = false;
  draggedEvent.value = null;
  dropTargetDate.value = null;
}

function setDropTarget(item) {
  if (!dragging.value) return;
  dropTargetDate.value = format(item.date, "yyyy-MM-dd'T'HH:mm:ss");
}

onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", endDrag);
});
const props = defineProps({
  onOpenModal: Function,
  onDetail: Function,
});

const scheduleStore = useScheduleStore();
const router = useRouter();

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth());
const selectedDate = ref(new Date());

const calendarDates = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);

  const startDay = getDay(start); // 0 (Sunday) ~ 6 (Saturday)
  const totalDays = getDaysInMonth(start);

  const prevMonth = subMonths(start, 1);
  const nextMonth = addMonths(start, 1);
  const prevMonthDays = getDaysInMonth(prevMonth);

  const calendar = [];

  // 이전 달 날짜들
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    calendar.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
      isCurrentMonth: false,
    });
  }

  // 현재 달 날짜들
  for (let i = 1; i <= totalDays; i++) {
    calendar.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // 다음 달 날짜들 (총 42개 되게)
  while (calendar.length < 42) {
    const nextDay = calendar.length - (startDay + totalDays) + 1;
    calendar.push({
      date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay),
      isCurrentMonth: false,
    });
  }
  return calendar;
});

const eventsByDate = computed(() => {
  const result = new Map();

  scheduleStore.plans.forEach((event) => {
    const start = parseISO(event.startAt || event.date);
    const end = event.endAt ? parseISO(event.endAt) : null;

    const dateList = end ? eachDayOfInterval({ start, end }) : [start];

    dateList.forEach((date, idx) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const isStart = idx === 0;
      const isEnd = idx === dateList.length - 1;

      if (!result.has(dateStr)) result.set(dateStr, []);

      result.get(dateStr).push({
        ...event,
        _position: end
          ? isStart
            ? "start"
            : isEnd
              ? "end"
              : "middle"
          : "start",
      });
    });
  });
  return result;
});

const isSunday = (index) => index % 7 === 0;
const isSaturday = (index) => index % 7 === 6;

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const handleCreateClick = () => {
  props.onOpenModal();
};

const handleDateClick = (date) => {
  const clickedMonth = date.getMonth();
  const clickedYear = date.getFullYear();

  // 현재 선택된 달이랑 다르면 변경
  if (
    clickedMonth !== currentMonth.value ||
    clickedYear !== currentYear.value
  ) {
    currentMonth.value = clickedMonth;
    currentYear.value = clickedYear;
  }
  scheduleStore.setCurrentDate(date);
  router.push("/schedule/detail");
};

const handleEventClick = (event) => {
  scheduleStore.setCurrentDate(event.startAt);
  selectedDate.value = event.date;
  //props.onDetail();
  router.push(`/schedule/detail/${event.idx}`);
};
</script>

<template>
  <div class="calendar_wrapper">
    <div class="calendar_header">
      <div>
        <span class="month_year"
          >{{ currentYear }}년 {{ currentMonth + 1 }}월</span
        >
        <div class="nav_buttons">
          <div @click="prevMonth" class="prev_btn">
            <img src="/src/assets/icons/arrow_left.svg" alt="prev" />
          </div>
          <div @click="nextMonth" class="next_btn">
            <img src="/src/assets/icons/arrow_right.svg" alt="next" />
          </div>
        </div>
      </div>
      <button class="create_btn" @click="handleCreateClick">
        <img src="/src/assets/icons/plus.png" alt="+" />
        만들기
      </button>
    </div>

    <div class="calendar_grid">
      <div
        class="day_label"
        v-for="(day, index) in days"
        :key="index"
        :class="{ sunday: index === 0, saturday: index === 6 }"
      >
        {{ day }}
      </div>

      <div
        class="calendar_cell"
        v-for="(item, index) in calendarDates"
        :key="item.date.toISOString()"
        :class="{
          not_this_month: !item.isCurrentMonth,
          today_cell:
            format(item.date, 'yyyy-MM-dd') ===
            format(new Date(), 'yyyy-MM-dd'),
        }"
        @mouseenter="setDropTarget(item)"
      >
        <div
          class="date_number"
          :class="{
            red: isSunday(index),
            blue: isSaturday(index),
            today_date:
              format(item.date, 'yyyy-MM-dd') ===
              format(new Date(), 'yyyy-MM-dd'),
          }"
          @click="handleDateClick(item.date)"
        >
          {{ item.date.getDate() }}
        </div>
        <div class="event_wrapper">
          <div
            v-for="event in eventsByDate.get(format(item.date, 'yyyy-MM-dd')) ||
            []"
            :key="event.idx + '-' + format(item.date, 'yyyy-MM-dd')"
            :class="['event', event._position]"
            :style="{ backgroundColor: hexToRgba(event.color, 0.25) }"
            :title="event.title"
            @click="handleEventClick(event)"
            @mousedown="startDrag($event, event)"
          >
            <template v-if="event._position === 'start'">
              <span v-if="scheduleStore.currentPet?.idx == null"
                >[{{ event.petName }}]</span
              >
              {{ event.title }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="dragging && draggedEvent"
      class="drag-ghost"
      :style="{
        left: ghostX + 'px',
        top: ghostY + 'px',
        width: ghostWidth + 'px',
        height: ghostHeight + 'px',
        backgroundColor: hexToRgba(draggedEvent.color, 0.25),
      }"
    >
      {{ draggedEvent.title }}
    </div>
  </div>
</template>

<style scoped>
.calendar_wrapper {
  min-width: 486px;
  margin-bottom: 50px;
}
.calendar_header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  padding: 0 10px;
}

.calendar_header > div {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.month_year {
  font-family: Cafe24SSurround;
  width: 145px;
}

.nav_buttons {
  display: flex;
}

.nav_buttons img {
  width: 17px;
  height: 17px;
}

.nav_buttons > div {
  border: 1px solid var(--gray300);
  padding: 1px 5px;
  transition: all 0.3s;
}

.nav_buttons > div:hover {
  background-color: var(--gray200);
}

.prev_btn {
  border-radius: 5px 0 0 5px;
}

.next_btn {
  border-radius: 0 5px 5px 0;
}

.create_btn {
  border-radius: 8px;
  border: 1px solid var(--gray400);
  background: #fff;
  box-shadow: 2px 2px 2px 0px rgba(0, 0, 0, 0.25);
  padding: 10px;
  display: flex;
  gap: 5px;
  align-items: center;
  transition: all 0.3s;
  cursor: pointer;
  font-size: 16px;
  font-weight: normal;
}

.create_btn:hover {
  background-color: var(--gray300);
}

.create_btn > img {
  width: 12px;
  height: 12px;
}

.calendar_grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid var(--gray200);
  border-radius: 16px;
}

.day_label {
  text-align: center;
  padding: 12px 0;
  color: var(--gray900);
  font-family: Cafe24Ssurround;
  font-size: 14px;
  background-color: #f7f5f3;
}

.day_label.sunday {
  border-top-left-radius: 16px;
  color: var(--main-color-red);
}

.day_label.saturday {
  border-top-right-radius: 16px;
  color: var(--main-color-blue);
}

.calendar_cell {
  min-height: 110px;
  background-color: #fff;
  position: relative;
  font-size: 14px;
  border: 0.5px solid var(--gray200);

  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.date_number {
  font-size: 14px;
  width: fit-content;
  padding: 5px;
  margin: 3px 5px;
  border-radius: 99px;
  cursor: pointer;
}

.date_number:hover {
  background-color: var(--main-color-light);
}

.red {
  color: var(--main-color-red);
}
.blue {
  color: var(--main-color-blue);
}

.today_cell {
  border: 1px solid var(--gray500);
}

.today_date {
  font-weight: bold;
  font-size: 16px;
  margin: 2px 4px;
}

.event_wrapper {
  flex-grow: 1;
  overflow: hidden;
}

.not_this_month {
  opacity: 0.3;
}

.event {
  height: 20px;
  margin-top: 2px;
  padding: 5px 6px;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  z-index: 10;
}

.event.middle,
.event.end {
  color: transparent;
  padding: 0;
}

.drag-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  border-radius: 6px;
  opacity: 0.7;
  padding: 2px 6px;
  box-sizing: border-box;
  border: 1px dashed #999;
}
</style>
