package com.owaiskhan.monthlyplanning.widgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Mirrors `WidgetSnapshot` in src/widgets/snapshot.ts, same as the Swift
 * `PlannerSnapshot`. Parsed with org.json rather than a serialization library
 * so the widgets pull in no extra dependencies.
 */
data class Habit(val id: String, val name: String)

data class Goal(val text: String, val done: Boolean)

data class PlannerSnapshot(
  val year: Int,
  val month: Int,
  val monthName: String,
  val daysInMonth: Int,
  val today: Int?,
  val habits: List<Habit>,
  val grid: Map<String, String>,
  val monthDone: Int,
  val monthMissed: Int,
  val monthTotal: Int,
  val monthPct: Int,
  val currentStreak: Int,
  val bestStreak: Int,
  val perfectStreak: Int,
  val goals: List<Goal>,
  val yearDone: List<List<Int>>,
  val yearMissed: List<List<Int>>,
  val yearHabitCounts: List<Int>,
  val yearTotal: Int,
  val quotes: List<String>,
) {
  /** 0 pending, 1 done, 2 missed */
  fun state(day: Int, habitIndex: Int): Int {
    val row = grid[day.toString()] ?: return 0
    if (habitIndex < 0 || habitIndex >= row.length) return 0
    return row[habitIndex].digitToIntOrNull() ?: 0
  }

  fun doneCount(day: Int): Int = grid[day.toString()]?.count { it == '1' } ?: 0

  /** Same day-of-year rotation as quoteForDate in src/quotes.ts. */
  fun quote(dayOfYear: Int): String? =
    if (quotes.isEmpty()) null else quotes[dayOfYear % quotes.size]

  companion object {
    fun load(context: Context): PlannerSnapshot? {
      val json = context
        .getSharedPreferences("widget_snapshot", Context.MODE_PRIVATE)
        .getString("widgetSnapshot", null) ?: return null
      return runCatching { parse(JSONObject(json)) }.getOrNull()
    }

    private fun intMatrix(array: JSONArray?): List<List<Int>> {
      if (array == null) return emptyList()
      return (0 until array.length()).map { i ->
        val row = array.optJSONArray(i) ?: JSONArray()
        (0 until row.length()).map { row.optInt(it) }
      }
    }

    private fun parse(o: JSONObject): PlannerSnapshot {
      val habits = o.optJSONArray("habits").let { arr ->
        (0 until (arr?.length() ?: 0)).map {
          val h = arr!!.getJSONObject(it)
          Habit(h.optString("id"), h.optString("name"))
        }
      }
      val goals = o.optJSONArray("goals").let { arr ->
        (0 until (arr?.length() ?: 0)).map {
          val g = arr!!.getJSONObject(it)
          Goal(g.optString("text"), g.optBoolean("done"))
        }
      }
      val grid = mutableMapOf<String, String>()
      o.optJSONObject("grid")?.let { g ->
        g.keys().forEach { key -> grid[key] = g.optString(key) }
      }
      val quotes = o.optJSONArray("quotes").let { arr ->
        (0 until (arr?.length() ?: 0)).map { arr!!.optString(it) }
      }
      return PlannerSnapshot(
        year = o.optInt("year"),
        month = o.optInt("month"),
        monthName = o.optString("monthName"),
        daysInMonth = o.optInt("daysInMonth", 30),
        today = if (o.isNull("today")) null else o.optInt("today"),
        habits = habits,
        grid = grid,
        monthDone = o.optInt("monthDone"),
        monthMissed = o.optInt("monthMissed"),
        monthTotal = o.optInt("monthTotal"),
        monthPct = o.optInt("monthPct"),
        currentStreak = o.optInt("currentStreak"),
        bestStreak = o.optInt("bestStreak"),
        perfectStreak = o.optInt("perfectStreak"),
        goals = goals,
        yearDone = intMatrix(o.optJSONArray("yearDone")),
        yearMissed = intMatrix(o.optJSONArray("yearMissed")),
        yearHabitCounts = o.optJSONArray("yearHabitCounts").let { arr ->
          (0 until (arr?.length() ?: 0)).map { arr!!.optInt(it) }
        },
        yearTotal = o.optInt("yearTotal"),
        quotes = quotes,
      )
    }

    /** Shown in the widget picker and before the app has ever written a snapshot. */
    val placeholder = PlannerSnapshot(
      year = 2026,
      month = 7,
      monthName = "AUGUST",
      daysInMonth = 31,
      today = 15,
      habits = listOf(
        Habit("0", "Read 20 pages"),
        Habit("1", "Gym"),
        Habit("2", "No sugar"),
        Habit("3", "Deep work"),
      ),
      grid = (1..15).associate { it.toString() to listOf("1110", "1101", "1111", "1011", "1210")[it % 5] },
      monthDone = 52,
      monthMissed = 6,
      monthTotal = 124,
      monthPct = 42,
      currentStreak = 9,
      bestStreak = 21,
      perfectStreak = 3,
      goals = listOf(Goal("Ship v1", true), Goal("Run 50k", false), Goal("Read 3 books", false)),
      yearDone = (0 until 12).map { m -> (0 until 30).map { if (m <= 7) (it % 4) else 0 } },
      yearMissed = (0 until 12).map { (0 until 30).map { 0 } },
      yearHabitCounts = List(12) { 4 },
      yearTotal = 318,
      quotes = listOf("Discipline is choosing between what you want now and what you want most."),
    )
  }
}
