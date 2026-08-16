package com.owaiskhan.monthlyplanning.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import java.util.Calendar

/**
 * Android widgets, the counterpart of the Swift widgets in targets/widgets.
 * (Careful with paths in block comments here: Kotlin nests them, so a literal
 * slash-star inside one opens a second comment and swallows the closer.)
 *
 * Android has no small/medium/large: widgets are freely resizable, so each one
 * declares responsive breakpoints and picks a layout from the size it is handed.
 */

private val SMALL = DpSize(140.dp, 140.dp)
private val WIDE = DpSize(300.dp, 130.dp)
private val LARGE = DpSize(300.dp, 280.dp)
private val BUCKETS = setOf(SMALL, WIDE, LARGE)

private fun Context.px(dp: Float): Int = (dp * resources.displayMetrics.density).toInt()

private fun snapshotOf(context: Context) =
  PlannerSnapshot.load(context) ?: PlannerSnapshot.placeholder

@Composable
private fun WidgetScaffold(theme: WidgetTheme, padding: Int = 14, content: @Composable () -> Unit) {
  Box(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(theme.provider(theme.bg))
      .cornerRadius(20.dp)
      .padding(padding.dp)
  ) { content() }
}

@Composable
private fun Heading(text: String, theme: WidgetTheme, trailing: String? = null) {
  Row(
    modifier = GlanceModifier.fillMaxWidth(),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Box(
      modifier = GlanceModifier
        .width(3.dp).height(11.dp)
        .background(theme.provider(theme.accent))
        .cornerRadius(2.dp)
    ) {}
    Spacer(GlanceModifier.width(6.dp))
    Text(
      text = text,
      style = TextStyle(
        color = theme.provider(theme.ink),
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
      ),
    )
    Spacer(GlanceModifier.defaultWeight())
    if (trailing != null) {
      Text(
        text = trailing,
        style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp),
      )
    }
  }
}

@Composable
private fun Stat(value: String, label: String, theme: WidgetTheme) {
  Row(verticalAlignment = Alignment.CenterVertically) {
    Text(
      text = value,
      style = TextStyle(
        color = theme.provider(theme.ink), fontSize = 15.sp, fontWeight = FontWeight.Bold,
      ),
    )
    Spacer(GlanceModifier.width(4.dp))
    Text(text = label, style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 11.sp))
  }
}

// MARK: Radial tracker

class RadialWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(BUCKETS)
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { RadialContent() }
}

@Composable
private fun RadialContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val compact = size.width < 220.dp

  WidgetScaffold(theme) {
    if (compact) {
      Column(
        modifier = GlanceModifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Image(
          provider = ImageProvider(drawRadialChart(snap, theme, context.px(96f))),
          contentDescription = "Month tracker",
          modifier = GlanceModifier.size(96.dp),
        )
        Spacer(GlanceModifier.height(4.dp))
        Text(
          text = "${snap.monthDone}/${snap.monthTotal}",
          style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 11.sp),
        )
      }
    } else {
      Row(modifier = GlanceModifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
        Image(
          provider = ImageProvider(drawRadialChart(snap, theme, context.px(104f), minRings = 6)),
          contentDescription = "Month tracker",
          modifier = GlanceModifier.size(104.dp),
        )
        Spacer(GlanceModifier.width(12.dp))
        Column(modifier = GlanceModifier.defaultWeight()) {
          Heading(snap.monthName, theme, "${snap.year}")
          Spacer(GlanceModifier.height(6.dp))
          Stat("${snap.monthPct}%", "of the month done", theme)
          Stat("${snap.currentStreak}", "day streak", theme)
          Stat("${snap.habits.size}", "habits tracked", theme)
        }
      }
    }
  }
}

class RadialReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = RadialWidget()
}

// MARK: Year tracker (wide only, like iOS)

class YearWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(setOf(WIDE, LARGE))
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { YearContent() }
}

@Composable
private fun YearContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)

  WidgetScaffold(theme) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
      Heading("${snap.year}", theme, "${snap.yearTotal} check-ins")
      Spacer(GlanceModifier.height(8.dp))
      Image(
        provider = ImageProvider(
          drawYearGrid(snap, theme, context.px(260f), context.px(9f).toFloat(), context.px(2f).toFloat(), weekLimit = 17)
        ),
        contentDescription = "Last 17 weeks",
        modifier = GlanceModifier.fillMaxWidth().height(78.dp),
      )
      Spacer(GlanceModifier.defaultWeight())
      Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text("last 17 weeks", style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp))
        Spacer(GlanceModifier.defaultWeight())
        Text(
          "${snap.currentStreak}d streak",
          style = TextStyle(color = theme.provider(theme.accent), fontSize = 11.sp, fontWeight = FontWeight.Bold),
        )
      }
    }
  }
}

class YearReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = YearWidget()
}

// MARK: Month progress

class ProgressWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(setOf(SMALL, WIDE))
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { ProgressContent() }
}

@Composable
private fun ProgressContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val fraction = if (snap.monthTotal > 0) snap.monthDone.toFloat() / snap.monthTotal else 0f

  WidgetScaffold(theme) {
    if (size.width < 220.dp) {
      Column(
        modifier = GlanceModifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Box(contentAlignment = Alignment.Center) {
          Image(
            provider = ImageProvider(drawProgressRing(fraction, theme, context.px(86f), context.px(9f).toFloat())),
            contentDescription = "Month progress",
            modifier = GlanceModifier.size(86.dp),
          )
          Text(
            "${snap.monthPct}%",
            style = TextStyle(color = theme.provider(theme.ink), fontSize = 20.sp, fontWeight = FontWeight.Bold),
          )
        }
        Spacer(GlanceModifier.height(6.dp))
        Text(snap.monthName, style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp, fontWeight = FontWeight.Bold))
      }
    } else {
      Row(modifier = GlanceModifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
        Box(contentAlignment = Alignment.Center) {
          Image(
            provider = ImageProvider(drawProgressRing(fraction, theme, context.px(78f), context.px(10f).toFloat())),
            contentDescription = "Month progress",
            modifier = GlanceModifier.size(78.dp),
          )
          Text(
            "${snap.monthPct}%",
            style = TextStyle(color = theme.provider(theme.ink), fontSize = 17.sp, fontWeight = FontWeight.Bold),
          )
        }
        Spacer(GlanceModifier.width(14.dp))
        Column(modifier = GlanceModifier.defaultWeight()) {
          Heading(snap.monthName, theme)
          Spacer(GlanceModifier.height(6.dp))
          Stat("${snap.monthDone}", "checked off", theme)
          Stat("${snap.monthMissed}", "missed", theme)
          Stat("${snap.currentStreak}", "day streak", theme)
        }
      }
    }
  }
}

class ProgressReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = ProgressWidget()
}

// MARK: Streak

class StreakWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(setOf(SMALL, WIDE))
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { StreakContent() }
}

@Composable
private fun StreakContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val pips = drawPips(snap, theme, context.px(11f).toFloat(), context.px(4f).toFloat())

  WidgetScaffold(theme) {
    if (size.width < 220.dp) {
      Column(
        modifier = GlanceModifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text(
          "${snap.currentStreak}",
          style = TextStyle(color = theme.provider(theme.done), fontSize = 40.sp, fontWeight = FontWeight.Bold),
        )
        Text("DAY STREAK", style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 9.sp, fontWeight = FontWeight.Bold))
        if (pips != null) {
          Spacer(GlanceModifier.height(6.dp))
          Image(provider = ImageProvider(pips), contentDescription = "Last 7 days", modifier = GlanceModifier.height(11.dp))
        }
        Spacer(GlanceModifier.height(4.dp))
        Text("best ${snap.bestStreak}", style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp))
      }
    } else {
      Row(modifier = GlanceModifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          Text(
            "${snap.currentStreak}",
            style = TextStyle(color = theme.provider(theme.done), fontSize = 42.sp, fontWeight = FontWeight.Bold),
          )
          Text("DAYS", style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 9.sp, fontWeight = FontWeight.Bold))
        }
        Spacer(GlanceModifier.width(14.dp))
        Column(modifier = GlanceModifier.defaultWeight()) {
          Heading("STREAK", theme)
          Spacer(GlanceModifier.height(6.dp))
          Stat("${snap.bestStreak}", "best this year", theme)
          Stat("${snap.perfectStreak}", "perfect days", theme)
          if (pips != null) {
            Spacer(GlanceModifier.height(6.dp))
            Image(provider = ImageProvider(pips), contentDescription = "Last 7 days", modifier = GlanceModifier.height(11.dp))
          }
        }
      }
    }
  }
}

class StreakReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = StreakWidget()
}

// MARK: Today's check

class TodayWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(BUCKETS)
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { TodayContent() }
}

@Composable
private fun StateChip(state: Int, theme: WidgetTheme) {
  Box(
    modifier = GlanceModifier
      .size(14.dp)
      .cornerRadius(4.dp)
      .background(theme.provider(theme.stateColor(state))),
    contentAlignment = Alignment.Center,
  ) {
    if (state != 0) {
      Text(
        text = if (state == 1) "✓" else "✕",
        style = TextStyle(color = theme.provider(theme.onState), fontSize = 9.sp, fontWeight = FontWeight.Bold),
      )
    }
  }
}

@Composable
private fun TodayContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val limit = if (size.height >= 240.dp) 8 else if (size.width < 220.dp) 3 else 4
  val today = snap.today
  val rows = if (today == null) emptyList() else snap.habits.mapIndexed { i, h ->
    (h.name.ifEmpty { "Unnamed habit" }) to snap.state(today, i)
  }
  val done = rows.count { it.second == 1 }

  WidgetScaffold(theme) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
      Heading("TODAY", theme, if (rows.isEmpty()) null else "$done/${rows.size}")
      Spacer(GlanceModifier.height(6.dp))
      if (rows.isEmpty()) {
        Text(
          "Open the app to sync this month.",
          style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 11.sp),
        )
      } else {
        rows.take(limit).forEach { (name, state) ->
          Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            StateChip(state, theme)
            Spacer(GlanceModifier.width(7.dp))
            Text(
              text = name,
              maxLines = 1,
              style = TextStyle(
                color = theme.provider(if (state == 1) theme.inkSoft else theme.ink),
                fontSize = 12.sp,
              ),
            )
          }
        }
        if (rows.size > limit) {
          Text(
            "+${rows.size - limit} more",
            style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp),
          )
        }
      }
    }
  }
}

class TodayReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = TodayWidget()
}

// MARK: Key goals

class GoalsWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(setOf(WIDE, LARGE))
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { GoalsContent() }
}

@Composable
private fun GoalsContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val doneCount = snap.goals.count { it.done }

  WidgetScaffold(theme) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
      Heading("KEY GOALS", theme, if (snap.goals.isEmpty()) null else "$doneCount/${snap.goals.size}")
      Spacer(GlanceModifier.height(6.dp))
      if (snap.goals.all { it.text.isEmpty() }) {
        Text(
          "Set this month's goals in the app.",
          style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 11.sp),
        )
      } else {
        snap.goals.forEach { goal ->
          Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            StateChip(if (goal.done) 1 else 0, theme)
            Spacer(GlanceModifier.width(8.dp))
            Text(
              text = goal.text.ifEmpty { "—" },
              maxLines = 1,
              style = TextStyle(
                color = theme.provider(if (goal.done) theme.done else theme.ink),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
              ),
            )
          }
        }
      }
      if (size.height >= 240.dp) {
        Spacer(GlanceModifier.defaultWeight())
        Row(modifier = GlanceModifier.fillMaxWidth()) {
          Stat("${snap.monthPct}%", "month done", theme)
          Spacer(GlanceModifier.defaultWeight())
          Stat("${snap.currentStreak}", "day streak", theme)
        }
      }
    }
  }
}

class GoalsReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = GoalsWidget()
}

// MARK: Daily quote

class QuoteWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(BUCKETS)
  override suspend fun provideGlance(context: Context, id: GlanceId) =
    provideContent { QuoteContent() }
}

@Composable
private fun QuoteContent() {
  val context = LocalContext.current
  val theme = WidgetTheme.of(context)
  val snap = snapshotOf(context)
  val size = LocalSize.current
  val calendar = Calendar.getInstance()
  val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
  val quote = snap.quote(dayOfYear)
  val large = size.height >= 240.dp
  val fontSize = if (size.width < 220.dp) 12 else if (large) 18 else 14

  WidgetScaffold(theme, padding = if (size.width < 220.dp) 12 else 16) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
      Heading("DISCIPLINE.", theme)
      Spacer(GlanceModifier.height(if (large) 10.dp else 6.dp))
      if (quote == null) {
        Text(
          "Open the app to sync today's quote.",
          style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 11.sp),
        )
      } else {
        Text(
          text = "“$quote”",
          style = TextStyle(
            color = theme.provider(theme.ink),
            fontSize = fontSize.sp,
            fontWeight = FontWeight.Medium,
            fontStyle = androidx.glance.text.FontStyle.Italic,
          ),
        )
      }
      if (large) {
        Spacer(GlanceModifier.defaultWeight())
        val total = snap.habits.size
        val doneToday = snap.today?.let { snap.doneCount(it) } ?: 0
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
          if (total > 0) Stat("$doneToday/$total", "done today", theme)
          Spacer(GlanceModifier.defaultWeight())
          Text(
            "${snap.currentStreak}d",
            style = TextStyle(color = theme.provider(theme.accent), fontSize = 12.sp, fontWeight = FontWeight.Bold),
          )
        }
        Spacer(GlanceModifier.height(6.dp))
        YearBar(snap, theme, dayOfYear, calendar.getActualMaximum(Calendar.DAY_OF_YEAR))
      }
    }
  }
}

@Composable
private fun YearBar(snap: PlannerSnapshot, theme: WidgetTheme, dayOfYear: Int, daysInYear: Int) {
  val context = LocalContext.current
  val fraction = (dayOfYear.toFloat() / daysInYear).coerceIn(0f, 1f)
  Column(modifier = GlanceModifier.fillMaxWidth()) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
      Text(
        "${snap.year}",
        style = TextStyle(color = theme.provider(theme.ink), fontSize = 11.sp, fontWeight = FontWeight.Bold),
      )
      Spacer(GlanceModifier.defaultWeight())
      Text(
        "day $dayOfYear of $daysInYear",
        style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp),
      )
    }
    Spacer(GlanceModifier.height(4.dp))
    Image(
      provider = ImageProvider(
        drawProgressBar(fraction, theme, context.px(268f), context.px(6f))
      ),
      contentDescription = "Year progress",
      modifier = GlanceModifier.fillMaxWidth().height(6.dp),
    )
    Spacer(GlanceModifier.height(4.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
      Text(
        "${(fraction * 100).toInt()}% through the year",
        style = TextStyle(color = theme.provider(theme.inkSoft), fontSize = 10.sp),
      )
      Spacer(GlanceModifier.defaultWeight())
      Text(
        "${snap.yearTotal} check-ins",
        style = TextStyle(color = theme.provider(theme.done), fontSize = 10.sp, fontWeight = FontWeight.Bold),
      )
    }
  }
}

class QuoteReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = QuoteWidget()
}
