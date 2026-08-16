package expo.modules.widgetbridge

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android half of the widget bridge.
 *
 * Widgets here live in the app's own package, so they read SharedPreferences
 * directly — no App Group equivalent is needed. The stored JSON is byte-for-byte
 * the payload the iOS side writes, so `snapshot.ts` stays the single source.
 *
 * Refreshing is done by broadcasting ACTION_APPWIDGET_UPDATE to every provider
 * this package installs, rather than calling the widget classes directly: the
 * module is a library the app depends on, so it must not depend back on the app.
 */
const val PREFS_NAME = "widget_snapshot"
const val SNAPSHOT_KEY = "widgetSnapshot"

class WidgetBridgeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetBridge")

    Function("setSnapshot") { json: String ->
      val context: Context = appContext.reactContext ?: return@Function
      context
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(SNAPSHOT_KEY, json)
        .apply()

      runCatching {
        val manager = AppWidgetManager.getInstance(context)
        manager.installedProviders
          .filter { it.provider.packageName == context.packageName }
          .forEach { info ->
            val ids = manager.getAppWidgetIds(info.provider)
            if (ids.isNotEmpty()) {
              context.sendBroadcast(
                Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                  component = info.provider
                  putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                }
              )
            }
          }
      }
    }
  }
}
