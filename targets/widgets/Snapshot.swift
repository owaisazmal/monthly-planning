import Foundation
import WidgetKit

/// Mirrors `WidgetSnapshot` in src/widgets/snapshot.ts. Both sides must change together.
struct PlannerSnapshot: Codable {
  struct Habit: Codable {
    let id: String
    let name: String
  }

  struct Goal: Codable {
    let text: String
    let done: Bool
  }

  let updatedAt: Double
  let year: Int
  /// 0-based, matching the app
  let month: Int
  let monthName: String
  let daysInMonth: Int
  let today: Int?
  let habits: [Habit]
  /// day → one character per habit: "0" pending, "1" done, "2" missed
  let grid: [String: String]
  let monthDone: Int
  let monthMissed: Int
  let monthTotal: Int
  let monthPct: Int
  let currentStreak: Int
  let bestStreak: Int
  let perfectStreak: Int
  let goals: [Goal]
  let yearDone: [[Int]]
  let yearMissed: [[Int]]
  let yearHabitCounts: [Int]
  let yearTotal: Int
  /// Decoded leniently — snapshots written before the quote widget existed
  /// have no `quotes` key, and a missing one shouldn't fail the whole decode.
  let quotes: [String]?

  /// Same day-of-year rotation as `quoteForDate` in src/quotes.ts, so the app
  /// and the widget always show the same quote on a given day.
  func quote(on date: Date) -> String? {
    guard let quotes, !quotes.isEmpty else { return nil }
    let cal = Calendar.current
    guard let dayOfYear = cal.ordinality(of: .day, in: .year, for: date) else { return nil }
    return quotes[dayOfYear % quotes.count]
  }

  /// 0 pending, 1 done, 2 missed
  func state(day: Int, habitIndex: Int) -> Int {
    guard let row = grid[String(day)] else { return 0 }
    let chars = Array(row)
    guard habitIndex >= 0, habitIndex < chars.count else { return 0 }
    return Int(String(chars[habitIndex])) ?? 0
  }

  func doneCount(day: Int) -> Int {
    guard let row = grid[String(day)] else { return 0 }
    return row.filter { $0 == "1" }.count
  }

  func missedCount(day: Int) -> Int {
    guard let row = grid[String(day)] else { return 0 }
    return row.filter { $0 == "2" }.count
  }

  /// Shown before the app has ever written a snapshot, and in the widget gallery.
  static let placeholder: PlannerSnapshot = {
    let now = Date()
    let cal = Calendar.current
    let year = cal.component(.year, from: now)
    let month = cal.component(.month, from: now) - 1
    let day = cal.component(.day, from: now)
    let range = cal.range(of: .day, in: .month, for: now)?.count ?? 30
    let names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                 "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]

    var grid: [String: String] = [:]
    for d in 1...max(day, 1) {
      // a plausible-looking sample so the gallery preview isn't empty
      let pattern = ["1110", "1101", "1111", "1011", "1210"][d % 5]
      grid[String(d)] = pattern
    }

    var yearDone: [[Int]] = []
    var yearMissed: [[Int]] = []
    for m in 0..<12 {
      var comps = DateComponents()
      comps.year = year
      comps.month = m + 1
      let len = cal.range(of: .day, in: .month, for: cal.date(from: comps) ?? now)?.count ?? 30
      yearDone.append((0..<len).map { m <= month ? ($0 % 4 == 0 ? 0 : ($0 % 3) + 1) : 0 })
      yearMissed.append(Array(repeating: 0, count: len))
    }

    return PlannerSnapshot(
      updatedAt: now.timeIntervalSince1970 * 1000,
      year: year,
      month: month,
      monthName: names[min(max(month, 0), 11)],
      daysInMonth: range,
      today: day,
      habits: [
        .init(id: "0", name: "Read 20 pages"),
        .init(id: "1", name: "Gym"),
        .init(id: "2", name: "No sugar"),
        .init(id: "3", name: "Deep work"),
      ],
      grid: grid,
      monthDone: 52,
      monthMissed: 6,
      monthTotal: 124,
      monthPct: 42,
      currentStreak: 9,
      bestStreak: 21,
      perfectStreak: 3,
      goals: [
        .init(text: "Ship v1", done: true),
        .init(text: "Run 50k", done: false),
        .init(text: "Read 3 books", done: false),
      ],
      yearDone: yearDone,
      yearMissed: yearMissed,
      yearHabitCounts: Array(repeating: 4, count: 12),
      yearTotal: 318,
      quotes: [
        "Discipline is choosing between what you want now and what you want most.",
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        "You don't have to be extreme, just consistent.",
      ]
    )
  }()
}

enum SnapshotStore {
  /// Must match app.json, expo-target.config.js and WidgetBridgeModule.swift.
  static let appGroup = "group.com.owaiskhan.monthlyplanning"
  static let key = "widgetSnapshot"

  static func load() -> PlannerSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let json = defaults.string(forKey: key),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(PlannerSnapshot.self, from: data)
  }
}

struct SnapshotEntry: TimelineEntry {
  let date: Date
  let snapshot: PlannerSnapshot
  /// true when no snapshot has been written yet, so views can nudge the user
  let isPlaceholder: Bool
}

/// One provider serves every widget — they all render from the same snapshot.
struct SnapshotProvider: TimelineProvider {
  func placeholder(in context: Context) -> SnapshotEntry {
    SnapshotEntry(date: Date(), snapshot: .placeholder, isPlaceholder: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
    let loaded = SnapshotStore.load()
    completion(
      SnapshotEntry(
        date: Date(),
        snapshot: loaded ?? .placeholder,
        isPlaceholder: loaded == nil
      )
    )
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
    let loaded = SnapshotStore.load()
    let entry = SnapshotEntry(
      date: Date(),
      snapshot: loaded ?? .placeholder,
      isPlaceholder: loaded == nil
    )
    // The app reloads timelines whenever data changes; this refresh only needs
    // to roll "today" over at midnight.
    let midnight =
      Calendar.current.nextDate(
        after: Date(),
        matching: DateComponents(hour: 0, minute: 1),
        matchingPolicy: .nextTime
      ) ?? Date().addingTimeInterval(3600)
    completion(Timeline(entries: [entry], policy: .after(midnight)))
  }
}
