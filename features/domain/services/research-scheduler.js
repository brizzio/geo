import { createResearchExecutionFromService } from "../models";

function parseYmdParts(value) {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function toYmd(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isInYearMonth(ymd, year, month) {
  const parts = parseYmdParts(ymd);
  if (!parts) {
    return false;
  }
  return parts.year === year && parts.month === month;
}

function toScheduleKey(schedule) {
  return [
    String(schedule?.date || ""),
    String(schedule?.place_id || ""),
    String(schedule?.level_id || "")
  ].join("|");
}

function sortByDateAndPlace(a, b) {
  const keyA = `${String(a?.schedule?.date || "")}|${String(a?.schedule?.place_id || "")}`;
  const keyB = `${String(b?.schedule?.date || "")}|${String(b?.schedule?.place_id || "")}`;
  return keyA.localeCompare(keyB);
}

export function syncResearchServiceSchedulesForCurrentMonth({
  research,
  cluster,
  stores = [],
  products = [],
  existingSchedules = [],
  existingTasks = [],
  referenceDate = new Date()
}) {
  if (!research || !cluster) {
    return {
      records: [],
      schedulesToUpsert: [],
      tasksToUpsert: [],
      createdCount: 0,
      existingCount: 0
    };
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const monthStart = toYmd(year, month, 1);
  const monthEnd = toYmd(year, month, new Date(year, month, 0).getDate());
  const serviceId = String(research.id || "");

  const generated = createResearchExecutionFromService({
    research,
    cluster,
    stores,
    products,
    options: {
      range_start: monthStart,
      range_end: monthEnd
    }
  });

  const generatedSchedulesMonth = (generated.schedules || []).filter((item) =>
    isInYearMonth(item.date, year, month)
  );
  const generatedTasksByScheduleId = new Map(
    (generated.tasks || []).map((item) => [String(item.research_schedule_id || ""), item])
  );
  const generatedByKey = new Map(
    generatedSchedulesMonth.map((schedule) => [toScheduleKey(schedule), schedule])
  );

  const existingSchedulesMonth = (existingSchedules || []).filter(
    (item) =>
      String(item?.research_service_id || "") === serviceId &&
      isInYearMonth(item?.date, year, month)
  );
  const existingTasksByScheduleId = new Map(
    (existingTasks || [])
      .filter((task) => String(task?.research_service_id || "") === serviceId)
      .map((task) => [String(task.research_schedule_id || ""), task])
  );
  const existingByKey = new Map(
    existingSchedulesMonth.map((schedule) => [toScheduleKey(schedule), schedule])
  );

  const schedulesToUpsert = [];
  const tasksToUpsert = [];
  const records = [];
  let createdCount = 0;
  let existingCount = 0;

  generatedByKey.forEach((generatedSchedule, key) => {
    const existingSchedule = existingByKey.get(key) || null;
    if (existingSchedule) {
      const existingTask =
        existingTasksByScheduleId.get(String(existingSchedule.research_task_id || "")) ||
        existingTasksByScheduleId.get(String(existingSchedule.id || "")) ||
        null;

      if (existingTask) {
        existingCount += 1;
        records.push({
          source: "existing",
          schedule: existingSchedule,
          task: existingTask
        });
        return;
      }

      const generatedTask = generatedTasksByScheduleId.get(String(generatedSchedule.id || ""));
      if (!generatedTask) {
        existingCount += 1;
        records.push({
          source: "existing",
          schedule: existingSchedule,
          task: null
        });
        return;
      }

      const taskWithExistingSchedule = {
        ...generatedTask,
        research_schedule_id: existingSchedule.id
      };
      const scheduleWithTask = {
        ...existingSchedule,
        research_task_id: taskWithExistingSchedule.id
      };

      schedulesToUpsert.push(scheduleWithTask);
      tasksToUpsert.push(taskWithExistingSchedule);
      createdCount += 1;
      records.push({
        source: "created",
        schedule: scheduleWithTask,
        task: taskWithExistingSchedule
      });
      return;
    }

    const generatedTask = generatedTasksByScheduleId.get(String(generatedSchedule.id || ""));
    schedulesToUpsert.push(generatedSchedule);
    if (generatedTask) {
      tasksToUpsert.push(generatedTask);
    }
    createdCount += 1;
    records.push({
      source: "created",
      schedule: generatedSchedule,
      task: generatedTask || null
    });
  });

  existingSchedulesMonth.forEach((schedule) => {
    const alreadyIncluded = [...records].some(
      (entry) => String(entry.schedule?.id || "") === String(schedule.id || "")
    );
    if (alreadyIncluded) {
      return;
    }

    const task =
      existingTasksByScheduleId.get(String(schedule.research_task_id || "")) ||
      existingTasksByScheduleId.get(String(schedule.id || "")) ||
      null;
    existingCount += 1;
    records.push({
      source: "existing",
      schedule,
      task
    });
  });

  return {
    records: records.sort(sortByDateAndPlace),
    schedulesToUpsert,
    tasksToUpsert,
    createdCount,
    existingCount
  };
}
