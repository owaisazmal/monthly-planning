import SwiftUI
import WidgetKit

@main
struct MonthlyPlanningWidgetBundle: WidgetBundle {
  var body: some Widget {
    RadialTrackerWidget()
    YearTrackerWidget()
    MonthProgressWidget()
    StreakWidget()
    TodayWidget()
    GoalsWidget()
    QuoteWidget()
  }
}
