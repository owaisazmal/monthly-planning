package com.owaiskhan.monthlyplanning.widgets

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.graphics.Color
import androidx.glance.unit.ColorProvider

/**
 * Mirrors src/theme.ts and targets/widgets/Theme.swift. Colours are held as
 * plain Ints as well as Compose Colors, because the charts are drawn with
 * android.graphics.Paint, which takes Ints.
 */
data class WidgetTheme(
  val bg: Int,
  val card: Int,
  val ink: Int,
  val inkSoft: Int,
  val line: Int,
  val accent: Int,
  val cellEmpty: Int,
  val done: Int,
  val missed: Int,
  val onState: Int,
  val ghLevels: List<Int>,
) {
  val bgColor get() = Color(bg)
  val inkColor get() = Color(ink)
  val inkSoftColor get() = Color(inkSoft)
  val accentColor get() = Color(accent)
  val doneColor get() = Color(done)
  val cellEmptyColor get() = Color(cellEmpty)

  fun provider(value: Int) = ColorProvider(Color(value))

  fun stateColor(state: Int): Int = when (state) {
    1 -> done
    2 -> missed
    else -> cellEmpty
  }

  companion object {
    val dark = WidgetTheme(
      bg = 0xFF242424.toInt(),
      card = 0xFF313131.toInt(),
      ink = 0xFFFFFFE3.toInt(),
      inkSoft = 0xFFCBCBCB.toInt(),
      line = 0xFF5A5A5A.toInt(),
      accent = 0xFF8FA5BA.toInt(),
      cellEmpty = 0xFF2E2E2E.toInt(),
      done = 0xFF93C63F.toInt(),
      missed = 0xFFEF4C63.toInt(),
      onState = 0xFF242424.toInt(),
      ghLevels = listOf(
        0xFF2E2E2E.toInt(), 0xFF2D4B1F.toInt(), 0xFF497B2D.toInt(),
        0xFF6DA939.toInt(), 0xFF93C63F.toInt(),
      ),
    )

    val light = WidgetTheme(
      bg = 0xFFFFFFE3.toInt(),
      card = 0xFFFFFFFA.toInt(),
      ink = 0xFF4A4A4A.toInt(),
      inkSoft = 0xFF5F6B78.toInt(),
      line = 0xFFCBCBCB.toInt(),
      accent = 0xFF57697C.toInt(),
      cellEmpty = 0xFFE5E5D5.toInt(),
      done = 0xFF7FB32E.toInt(),
      missed = 0xFFE5405A.toInt(),
      onState = 0xFF2E2E2E.toInt(),
      ghLevels = listOf(
        0xFFE5E5D5.toInt(), 0xFFD9ECB2.toInt(), 0xFFB7DC7A.toInt(),
        0xFF9CCD4D.toInt(), 0xFF7FB32E.toInt(),
      ),
    )

    fun of(context: Context): WidgetTheme {
      val night = context.resources.configuration.uiMode and
        Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
      return if (night) dark else light
    }
  }
}
