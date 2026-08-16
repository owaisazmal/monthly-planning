import ExpoModulesCore
import WidgetKit

/// Must match `com.apple.security.application-groups` in app.json and in
/// targets/widgets/expo-target.config.js — all three have to agree or the
/// widgets silently read an empty container.
let appGroupIdentifier = "group.com.owaiskhan.monthlyplanning"
let snapshotKey = "widgetSnapshot"

public class WidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    Function("setSnapshot") { (json: String) -> Void in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else { return }
      defaults.set(json, forKey: snapshotKey)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
