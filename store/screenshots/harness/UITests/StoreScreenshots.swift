import XCTest

/// Captures the store screenshots in Spanish, Catalan and English.
final class StoreScreenshots: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.ivoriaplicacions.maestrosdelsudoku")

    struct Labels {
        let home, settings, close, hint, hintNext, lesson, lessonSkip, share, backToPuzzles, calendar, autoNotes: String
        let row, column: String
    }
    let labels: [String: Labels] = [
        "es": Labels(home: "Inicio", settings: "Configuración", close: "Cerrar", hint: "Pista", hintNext: "Siguiente",
                     lesson: "Lección", lessonSkip: "Ahora no", share: "Compartir", backToPuzzles: "Volver a los Sudokus",
                     calendar: "Calendario", autoNotes: "Notas automáticas", row: "Fila", column: "columna"),
        "ca": Labels(home: "Inici", settings: "Configuració", close: "Tancar", hint: "Pista", hintNext: "Següent",
                     lesson: "Lliçó", lessonSkip: "Ara no", share: "Compartir", backToPuzzles: "Tornar als Sudokus",
                     calendar: "Calendari", autoNotes: "Notes automàtiques", row: "Fila", column: "columna"),
        "en": Labels(home: "Home", settings: "Settings", close: "Close", hint: "Hint", hintNext: "Next",
                     lesson: "Lesson", lessonSkip: "Not now", share: "Share", backToPuzzles: "Back to Sudokus",
                     calendar: "Calendar", autoNotes: "Automatic notes", row: "Row", column: "column"),
    ]

    override func setUp() {
        continueAfterFailure = false
        app.activate()
        sleep(3)
    }

    func log(_ t: String) { print("HARNESS: \(t)") }

    func shot(_ name: String) {
        let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        log("shot \(name)")
    }

    func q(_ type: XCUIElement.ElementType, _ format: String, _ args: Any...) -> XCUIElement {
        app.descendants(matching: type).matching(NSPredicate(format: format, argumentArray: args)).firstMatch
    }

    func tap(_ e: XCUIElement, _ what: String, timeout: TimeInterval = 8) {
        if !e.waitForExistence(timeout: timeout) {
            log("MISSING \(what)")
            print("=== TREE ===\n\(app.debugDescription)\n=== END ===")
            XCTFail("Missing \(what)")
            return
        }
        e.tap()
    }

    func closeModals(_ L: Labels) {
        for _ in 0..<3 {
            let close = q(.button, "label == %@", L.close)
            guard close.exists, close.isHittable else { break }
            close.tap(); sleep(1)
        }
    }

    func goHome(_ L: Labels) {
        closeModals(L)
        let home = q(.button, "label == %@", L.home)
        if home.waitForExistence(timeout: 2) { home.tap(); sleep(1) }
    }

    func skipLesson(_ L: Labels) {
        let skip = q(.button, "label == %@", L.lessonSkip)
        if skip.waitForExistence(timeout: 2) { skip.tap(); sleep(1) }
    }

    func openLevel(_ n: Int, _ L: Labels) {
        goHome(L)
        let card = q(.button, "label MATCHES %@ AND NOT (label CONTAINS %@)", "(?is).*\\b(nivel|nivell|level)\\s*\(n)\\b.*", "#")
        for _ in 0..<6 where !(card.exists && card.isHittable) { app.swipeUp(); sleep(1) }
        tap(card, "level \(n) card")
        sleep(1)
        skipLesson(L)
    }

    func cell(_ L: Labels, _ r: Int, _ c: Int) -> XCUIElement {
        q(.switch, "label BEGINSWITH %@", "\(L.row) \(r), \(L.column) \(c),")
    }

    func readBoard(_ L: Labels) -> [[Int]] {
        var g = Array(repeating: Array(repeating: 0, count: 9), count: 9)
        let cells = app.switches.matching(NSPredicate(format: "label BEGINSWITH %@", "\(L.row) ")).allElementsBoundByIndex
        let re = try! NSRegularExpression(pattern: "^\\w+ (\\d), \\w+ (\\d), (\\d)")
        for e in cells {
            let s = e.label
            guard let m = re.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)) else { continue }
            let n = { (i: Int) in Int((s as NSString).substring(with: m.range(at: i)))! }
            g[n(1) - 1][n(2) - 1] = n(3)
        }
        return g
    }

    func solve(_ g: inout [[Int]]) -> Bool {
        for r in 0..<9 { for c in 0..<9 where g[r][c] == 0 {
            for v in 1...9 where fits(g, r, c, v) { g[r][c] = v; if solve(&g) { return true }; g[r][c] = 0 }
            return false
        } }
        return true
    }

    func fits(_ g: [[Int]], _ r: Int, _ c: Int, _ v: Int) -> Bool {
        for i in 0..<9 where g[r][i] == v || g[i][c] == v { return false }
        let br = r / 3 * 3, bc = c / 3 * 3
        for i in br..<br + 3 { for j in bc..<bc + 3 where g[i][j] == v { return false } }
        return true
    }

    func setLanguage(_ target: String, from L: Labels) {
        goHome(L)
        tap(q(.button, "label == %@", L.settings), "settings")
        sleep(1)
        let names: [String: [String]] = ["ca": ["Català", "Catalan"], "es": ["Castellà", "Spanish", "Castellano"], "en": ["Anglès", "Inglés", "English"]]
        let button = q(.switch, "label IN %@", names[target]!)
        for _ in 0..<4 where !(button.exists && button.isHittable) { app.swipeDown(); sleep(1) }
        tap(button, "language \(target)")
        sleep(2)
        closeModals(labels[target]!)
    }

    /// Fills in the board on screen, cell then digit.
    func solveOnScreen(_ L: Labels) {
        let start = readBoard(L)
        var solved = start
        XCTAssertTrue(solve(&solved))
        for i in 0..<81 where start[i / 9][i % 9] == 0 {
            let c = cell(L, i / 9 + 1, i % 9 + 1)
            if !c.exists { break }
            c.tap()
            let key = q(.button, "label MATCHES %@", "^\(solved[i / 9][i % 9]) \\d$")
            if key.exists { key.tap() }
        }
    }

    func currentLanguage() -> String {
        for (lang, L) in labels where q(.button, "label == %@", L.settings).exists { return lang }
        return "es"
    }

    /// A game left half-played shows a "continue" card above the levels. Finish it.
    func finishGameInProgress(_ L: Labels) {
        goHome(L)
        let card = q(.button, "label MATCHES %@ AND label CONTAINS %@", "(?is).*\\b(nivel|nivell|level)\\s*\\d+.*", "#")
        guard card.waitForExistence(timeout: 2) else { return }
        log("finishing the game in progress: \(card.label)")
        card.tap()
        sleep(2)
        skipLesson(L)
        solveOnScreen(L)
        _ = q(.button, "label == %@", L.share).waitForExistence(timeout: 10)
        tap(q(.button, "label CONTAINS %@", L.backToPuzzles), "back after clearing")
        sleep(1)
    }

    func capture(_ lang: String, puzzle: Int) {
        let L = labels[lang]!
        finishGameInProgress(L)

        goHome(L)
        app.swipeDown(); sleep(1)
        shot("\(lang)-1-levels")

        tap(q(.button, "label BEGINSWITH %@", L.calendar), "calendar toggle")
        sleep(1)
        shot("\(lang)-5-daily")
        tap(q(.button, "label BEGINSWITH %@", L.calendar), "calendar toggle again")
        sleep(1)

        openLevel(8, L)
        tap(q(.button, "label == %@", L.lesson), "lesson button")
        sleep(2)
        shot("\(lang)-3-lesson")
        skipLesson(L)
        closeModals(L)

        openLevel(8, L)
        tap(q(.button, "label MATCHES %@", "(?s)^#\(puzzle)\\D.*"), "puzzle #\(puzzle)")
        let opened = Date()
        sleep(2)
        skipLesson(L)
        tap(q(.button, "label BEGINSWITH %@", L.hint), "hint button")
        sleep(1)
        tap(q(.button, "label == %@", L.hintNext), "hint next")
        sleep(1)
        shot("\(lang)-2-hint")

        let hintClose = q(.button, "label == %@", L.close)
        if hintClose.exists && hintClose.isHittable { hintClose.tap(); sleep(1) }
        tap(q(.button, "label BEGINSWITH %@", L.autoNotes), "auto notes")
        sleep(1)
        let middle = cell(L, 5, 5)
        if middle.exists { middle.tap(); sleep(1) }
        shot("\(lang)-4-notes")

        // A believable solving time, still under the five minutes that would cost a star.
        let wait = 195 - Date().timeIntervalSince(opened)
        if wait > 0 { log("waiting \(Int(wait)) s for a believable time"); usleep(useconds_t(wait * 1_000_000)) }
        solveOnScreen(L)
        _ = q(.button, "label == %@", L.share).waitForExistence(timeout: 10)
        sleep(3)
        shot("\(lang)-6-victory")
        tap(q(.button, "label CONTAINS %@", L.backToPuzzles), "back to puzzles")
        sleep(1)
    }

    func testStoreFlow() {
        let first = currentLanguage()
        log("app language at start: \(first)")
        if first != "es" { setLanguage("es", from: labels[first]!) }
        capture("es", puzzle: 2)
        setLanguage("ca", from: labels["es"]!)
        capture("ca", puzzle: 3)
        setLanguage("en", from: labels["ca"]!)
        capture("en", puzzle: 4)
        setLanguage("es", from: labels["en"]!)
    }
}
