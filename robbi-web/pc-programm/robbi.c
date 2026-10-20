/*
 *  R O B B I  –  Karteikarten-Sprachtrainer
 *  -----------------------------------------
 *  Die Wörter stehen NICHT im Code, sondern in Textdateien:
 *    sprachen.txt    ->  Liste der Sprachen   (Name ; Datei)
 *    farsi.txt       ->  Vokabeln             (fremd ; deutsch ; Notiz)
 *    griechisch.txt  ->  Vokabeln
 *
 *  Dein Fortschritt (gekonnt / falsch) wird automatisch gespeichert in
 *    farsi_fortschritt.txt, griechisch_fortschritt.txt, ...
 *
 *  Neue Wörter:   in die .txt-Datei eintragen oder im Menü "Neues Wort" wählen.
 *  Neue Sprache:  neue .txt-Datei anlegen + eine Zeile in sprachen.txt.
 *
 *  Visual Studio: Alle .txt-Dateien in den Projektordner legen
 *  (dort, wo auch robbi.c liegt).
 */

#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
#endif
#endif

#define MAX_CARDS 5000
#define MAX_CATS  80
#define MAX_LANGS 32
#define LEN       256

/* Farben (Meer-Türkis, Koralle, Sand) */
#define C_RESET "\x1b[0m"
#define C_BOLD  "\x1b[1m"
#define C_TEAL  "\x1b[38;5;44m"
#define C_DEEP  "\x1b[38;5;31m"
#define C_CORAL "\x1b[38;5;210m"
#define C_SAND  "\x1b[38;5;223m"
#define C_GREY  "\x1b[38;5;246m"
#define C_GREEN "\x1b[38;5;114m"
#define C_RED   "\x1b[38;5;203m"

/* Status einer Karte */
#define ST_NEW   'N'   /* noch nie gelernt               */
#define ST_KNOWN 'K'   /* zuletzt beim 1. Versuch gewusst */
#define ST_WRONG 'F'   /* zuletzt falsch                 */

/* Auswahl beim Lernen */
#define MODE_ALL   0
#define MODE_NEW   1
#define MODE_WRONG 2
#define MODE_KNOWN 3

typedef struct {
    char front[LEN];   /* Fremdsprache (lateinische Schrift) */
    char back[LEN];    /* Deutsch */
    char note[LEN];    /* optionale Notiz */
    int  cat;          /* Index der Kategorie */
    char status;       /* ST_NEW, ST_KNOWN, ST_WRONG */
} Card;

static Card cards[MAX_CARDS];
static int  nCards = 0;
static char cats[MAX_CATS][LEN];
static int  nCats = 0;

static char langNames[MAX_LANGS][LEN];
static char langFiles[MAX_LANGS][LEN];
static int  nLangs = 0;
static int  curLang = 0;

/* ------------------------------------------------------------ Hilfsfunktionen */

static void setupConsole(void) {
#ifdef _WIN32
    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD mode = 0;
    SetConsoleOutputCP(CP_UTF8);
    if (GetConsoleMode(h, &mode))
        SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
#endif
}

static void clearScreen(void) {
    printf("\x1b[2J\x1b[H");
    fflush(stdout);
}

static void trim(char *s) {
    char *p = s;
    size_t n;
    while (*p == ' ' || *p == '\t') p++;
    if (p != s) memmove(s, p, strlen(p) + 1);
    n = strlen(s);
    while (n > 0 && (s[n-1] == ' ' || s[n-1] == '\t' || s[n-1] == '\r' || s[n-1] == '\n'))
        s[--n] = '\0';
}

static void copyStr(char *dst, const char *src) {
    strncpy(dst, src, LEN - 1);
    dst[LEN - 1] = '\0';
}

/* Liest eine Zeile von der Tastatur (unter Windows mit Umlaut-Unterstützung). */
static int readLine(char *buf, int size) {
#ifdef _WIN32
    HANDLE hin = GetStdHandle(STD_INPUT_HANDLE);
    DWORD mode;
    if (GetConsoleMode(hin, &mode)) {
        wchar_t w[80];
        DWORD got = 0;
        if (!ReadConsoleW(hin, w, 79, &got, NULL) || got == 0) { buf[0] = '\0'; return 0; }
        w[got] = 0;
        if (got == 79 && w[78] != L'\n') {           /* zu lange Eingabe: Rest verwerfen */
            wchar_t junk[80];
            DWORD g2 = 0;
            do {
                if (!ReadConsoleW(hin, junk, 79, &g2, NULL)) break;
            } while (g2 > 0 && junk[g2 - 1] != L'\n');
        }
        if (!WideCharToMultiByte(CP_UTF8, 0, w, -1, buf, size, NULL, NULL)) buf[0] = '\0';
        trim(buf);
        return 1;
    }
#endif
    if (!fgets(buf, size, stdin)) { buf[0] = '\0'; return 0; }
    trim(buf);
    return 1;
}

static void waitEnter(void) {
    char b[LEN];
    printf(C_GREY "\n  [Enter] weiter ..." C_RESET);
    fflush(stdout);
    readLine(b, LEN);
}

static int askNumber(const char *prompt, int min, int max) {
    char b[LEN];
    int v;
    for (;;) {
        printf("%s", prompt);
        fflush(stdout);
        if (!readLine(b, LEN)) return min;           /* Eingabe-Ende -> Abbruch */
        if (sscanf(b, "%d", &v) == 1 && v >= min && v <= max) return v;
        printf(C_RED "  Bitte eine Zahl von %d bis %d eingeben.\n" C_RESET, min, max);
    }
}

static void stripBom(char *s) {
    if ((unsigned char)s[0] == 0xEF && (unsigned char)s[1] == 0xBB && (unsigned char)s[2] == 0xBF)
        memmove(s, s + 3, strlen(s + 3) + 1);
}

/* zerlegt "a ; b ; c" – gibt 1 zurück, wenn a und b vorhanden sind */
static int splitLine(char *line, char *a, char *b, char *c) {
    char *p1 = strchr(line, ';');
    char *p2;
    a[0] = b[0] = c[0] = '\0';
    if (!p1) return 0;
    *p1 = '\0';
    p2 = strchr(p1 + 1, ';');
    if (p2) { *p2 = '\0'; copyStr(c, p2 + 1); }
    copyStr(a, line);
    copyStr(b, p1 + 1);
    trim(a); trim(b); trim(c);
    return a[0] && b[0];
}

static int findOrAddCat(const char *name) {
    int i;
    for (i = 0; i < nCats; i++)
        if (strcmp(cats[i], name) == 0) return i;
    if (nCats >= MAX_CATS) return nCats - 1;
    copyStr(cats[nCats], name);
    return nCats++;
}

/* ------------------------------------------------------------ Dateien laden */

static void loadLanguages(void) {
    FILE *f = fopen("sprachen.txt", "r");
    char line[1024], a[LEN], b[LEN], c[LEN];
    int first = 1;
    nLangs = 0;
    if (f) {
        while (nLangs < MAX_LANGS && fgets(line, sizeof line, f)) {
            if (first) { stripBom(line); first = 0; }
            trim(line);
            if (!line[0] || line[0] == '#') continue;
            if (splitLine(line, a, b, c)) {
                copyStr(langNames[nLangs], a);
                copyStr(langFiles[nLangs], b);
                nLangs++;
            }
        }
        fclose(f);
    }
    if (nLangs == 0) {                       /* Standard, falls sprachen.txt fehlt */
        copyStr(langNames[0], "Farsi");
        copyStr(langFiles[0], "farsi.txt");
        nLangs = 1;
    }
}

static int loadVocab(const char *file) {
    FILE *f = fopen(file, "r");
    char line[1024], a[LEN], b[LEN], c[LEN];
    int cur = -1, first = 1;
    nCards = 0;
    nCats = 0;
    if (!f) return 0;
    while (fgets(line, sizeof line, f)) {
        if (first) { stripBom(line); first = 0; }
        trim(line);
        if (!line[0] || line[0] == '#') continue;
        if (line[0] == '[') {                  /* neue Kategorie */
            char *end = strchr(line, ']');
            char *name = line + 1;
            if (end) *end = '\0';
            trim(name);
            if (*name) cur = findOrAddCat(name);
            continue;
        }
        if (nCards >= MAX_CARDS) break;
        if (splitLine(line, a, b, c)) {
            if (cur < 0) cur = findOrAddCat("Allgemein");
            copyStr(cards[nCards].front, a);
            copyStr(cards[nCards].back, b);
            copyStr(cards[nCards].note, c);
            cards[nCards].cat = cur;
            cards[nCards].status = ST_NEW;
            nCards++;
        }
    }
    fclose(f);
    return 1;
}

/* ------------------------------------------------------------ Fortschritt */

/* farsi.txt -> farsi_fortschritt.txt */
static void progressFile(char *out) {
    char *dot;
    copyStr(out, langFiles[curLang]);
    dot = strrchr(out, '.');
    if (dot) *dot = '\0';
    if (strlen(out) + 20 < LEN) strcat(out, "_fortschritt.txt");
}

static void loadProgress(void) {
    char name[LEN], line[1024], a[LEN], b[LEN], c[LEN];
    FILE *f;
    int i;
    progressFile(name);
    f = fopen(name, "r");
    if (!f) return;
    while (fgets(line, sizeof line, f)) {
        trim(line);
        if (!line[0] || line[0] == '#') continue;
        /* Format:  K ; fremd ; deutsch */
        if (!splitLine(line, a, b, c) || !c[0]) continue;
        for (i = 0; i < nCards; i++) {
            if (strcmp(cards[i].front, b) == 0 && strcmp(cards[i].back, c) == 0) {
                cards[i].status = (a[0] == ST_KNOWN) ? ST_KNOWN : ST_WRONG;
                break;
            }
        }
    }
    fclose(f);
}

static void saveProgress(void) {
    char name[LEN];
    FILE *f;
    int i;
    progressFile(name);
    f = fopen(name, "w");
    if (!f) return;
    fprintf(f, "# Robbis Gedächtnis: K = gekonnt, F = falsch. Datei löschen = Fortschritt zurücksetzen.\n");
    for (i = 0; i < nCards; i++)
        if (cards[i].status != ST_NEW)
            fprintf(f, "%c ; %s ; %s\n", cards[i].status, cards[i].front, cards[i].back);
    fclose(f);
}

static int loadAll(void) {
    int ok = loadVocab(langFiles[curLang]);
    if (ok) loadProgress();
    return ok;
}

/* ------------------------------------------------------------ Robbe & Kopfzeile */

static void drawSeal(const char *speech) {
    printf("\n");
    printf(C_SAND "            _.---._\n");
    printf(C_SAND "          .'  " C_DEEP "o o" C_SAND "  '.\n");
    printf(C_SAND "         :  =  " C_CORAL "Y" C_SAND "  =  :" C_RESET "     " C_BOLD C_CORAL "%s" C_RESET "\n", speech);
    printf(C_SAND "          '.  `-'  .'\n");
    printf(C_TEAL "      ~~~~~~" C_SAND "'-----'" C_TEAL "~~~~~~~~~~~~\n" C_RESET);
    printf(C_DEEP "    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n" C_RESET);
}

static void header(const char *speech) {
    clearScreen();
    drawSeal(speech);
    if (nCards > 0)
        printf("  " C_BOLD C_CORAL "R O B B I" C_RESET C_GREY "  ·  dein Sprachtrainer  ·  "
               C_TEAL "%s" C_GREY " (%d Karten)\n\n" C_RESET, langNames[curLang], nCards);
    else
        printf("  " C_BOLD C_CORAL "R O B B I" C_RESET C_GREY "  ·  dein Sprachtrainer\n\n" C_RESET);
}

/* ------------------------------------------------------------ Zählen */

static int matches(const Card *c, int cat, int mode) {
    if (cat >= 0 && c->cat != cat) return 0;
    switch (mode) {
        case MODE_NEW:   return c->status == ST_NEW;
        case MODE_WRONG: return c->status == ST_WRONG;
        case MODE_KNOWN: return c->status == ST_KNOWN;
        default:         return 1;
    }
}

static int count(int cat, int mode) {
    int i, n = 0;
    for (i = 0; i < nCards; i++)
        if (matches(&cards[i], cat, mode)) n++;
    return n;
}

/* kleiner Balken: grün = gekonnt, rot = falsch, grau = neu */
static void progressBar(int cat, int width) {
    int total = count(cat, MODE_ALL), k, w, i;
    if (total == 0) return;
    k = count(cat, MODE_KNOWN) * width / total;
    w = count(cat, MODE_WRONG) * width / total;
    printf(C_GREEN);
    for (i = 0; i < k; i++) printf("█");
    printf(C_RED);
    for (i = 0; i < w; i++) printf("█");
    printf(C_GREY);
    for (i = k + w; i < width; i++) printf("░");
    printf(C_RESET);
}

/* ------------------------------------------------------------ Lernen */

static const char *modeName(int mode) {
    switch (mode) {
        case MODE_NEW:   return "neue";
        case MODE_WRONG: return "falsche";
        case MODE_KNOWN: return "gekonnte";
        default:         return "alle";
    }
}

static void learn(int mode) {
    int cat, dir, i, n = 0, nw, round = 1, firstCorrect = 0, firstAnswered = 0, quit = 0;
    int *list, *wrong;
    char b[LEN];

    if (nCards == 0) {
        header("Keine Karten da!");
        printf("  Die Vokabeldatei ist leer oder fehlt.\n");
        waitEnter();
        return;
    }

    /* 1. Welche Karten? (nur wenn nicht schon vorgegeben) */
    if (mode < 0) {
        header("Was lernen wir?");
        printf("  " C_TEAL "1)" C_RESET " Alle Karten     " C_GREY "(%d)\n" C_RESET, count(-1, MODE_ALL));
        printf("  " C_TEAL "2)" C_RESET " Nur neue        " C_GREY "(%d)\n" C_RESET, count(-1, MODE_NEW));
        printf("  " C_TEAL "3)" C_RESET " Nur falsche     " C_GREY "(%d)\n" C_RESET, count(-1, MODE_WRONG));
        printf("  " C_TEAL "4)" C_RESET " Nur gekonnte    " C_GREY "(%d)\n" C_RESET, count(-1, MODE_KNOWN));
        mode = askNumber("\n  Auswahl: ", 1, 4) - 1;
    }
    if (count(-1, mode) == 0) {
        header("Hier ist noch nichts!");
        printf("  Es gibt gerade keine %s Karten.\n", modeName(mode));
        if (mode == MODE_WRONG) printf("  Super – du hast keine Fehler offen!\n");
        if (mode == MODE_KNOWN) printf("  Lern erst ein paar Karten, dann kannst du sie hier wiederholen.\n");
        waitEnter();
        return;
    }

    /* 2. Kategorie */
    header("Welches Thema?");
    printf(C_GREY "  Karten: %s\n\n" C_RESET, modeName(mode));
    printf("  " C_TEAL " 0)" C_RESET " Alles gemischt " C_GREY "(%d)\n" C_RESET, count(-1, mode));
    for (i = 0; i < nCats; i++) {
        int c = count(i, mode);
        if (c == 0) printf(C_GREY "  %2d) %s (0)\n" C_RESET, i + 1, cats[i]);
        else        printf("  " C_TEAL "%2d)" C_RESET " %s " C_GREY "(%d)\n" C_RESET, i + 1, cats[i], c);
    }
    cat = askNumber("\n  Kategorie: ", 0, nCats) - 1;
    if (cat >= 0 && count(cat, mode) == 0) {
        printf(C_RED "  In dieser Kategorie gibt es keine %s Karten.\n" C_RESET, modeName(mode));
        waitEnter();
        return;
    }

    /* 3. Richtung */
    printf("\n  " C_TEAL "1)" C_RESET " %s -> Deutsch\n", langNames[curLang]);
    printf("  " C_TEAL "2)" C_RESET " Deutsch -> %s  " C_GREY "(besser zum Sprechen üben!)\n" C_RESET, langNames[curLang]);
    printf("  " C_TEAL "3)" C_RESET " Gemischt\n");
    dir = askNumber("\n  Richtung: ", 1, 3);

    list  = (int *)malloc(sizeof(int) * nCards);
    wrong = (int *)malloc(sizeof(int) * nCards);
    if (!list || !wrong) { free(list); free(wrong); return; }

    for (i = 0; i < nCards; i++)
        if (matches(&cards[i], cat, mode)) list[n++] = i;

    while (n > 0 && !quit) {
        for (i = n - 1; i > 0; i--) {             /* mischen */
            int j = rand() % (i + 1), t = list[i];
            list[i] = list[j];
            list[j] = t;
        }
        nw = 0;
        for (i = 0; i < n && !quit; i++) {
            Card *c = &cards[list[i]];
            int flip = (dir == 2) || (dir == 3 && rand() % 2);
            const char *q     = flip ? c->back  : c->front;
            const char *a     = flip ? c->front : c->back;
            const char *qLang = flip ? "Deutsch" : langNames[curLang];
            const char *aLang = flip ? langNames[curLang] : "Deutsch";

            header(round == 1 ? "Na, weißt du's?" : "Die Kniffligen nochmal!");
            printf(C_GREY "  Runde %d  ·  Karte %d / %d  ·  %s\n\n" C_RESET,
                   round, i + 1, n, cats[c->cat]);
            printf(C_DEEP "  ┌──────────────────────────────────────────┐\n" C_RESET);
            printf("    " C_GREY "%s\n" C_RESET, qLang);
            printf("    " C_BOLD C_TEAL "%s\n" C_RESET, q);
            printf(C_DEEP "  └──────────────────────────────────────────┘\n" C_RESET);
            printf(C_GREY "\n  Sag es laut! Dann [Enter] zum Umdrehen, [q] beendet. " C_RESET);
            fflush(stdout);
            if (!readLine(b, LEN) || b[0] == 'q' || b[0] == 'Q') { quit = 1; break; }

            printf("\n    " C_GREY "%s\n" C_RESET, aLang);
            printf("    " C_BOLD C_CORAL "%s\n" C_RESET, a);
            if (c->note[0]) printf("    " C_SAND "Tipp: %s\n" C_RESET, c->note);

            for (;;) {
                printf("\n  Gewusst?  " C_GREEN "[j] ja" C_RESET "   " C_RED "[n] nein" C_RESET "   " C_GREY "[q] beenden" C_RESET "  ");
                fflush(stdout);
                if (!readLine(b, LEN)) { quit = 1; break; }
                if (b[0] == 'j' || b[0] == 'J' || b[0] == 'y' || b[0] == 'Y') {
                    if (round == 1) { firstCorrect++; firstAnswered++; c->status = ST_KNOWN; }
                    break;
                }
                if (b[0] == 'n' || b[0] == 'N') {
                    if (round == 1) { firstAnswered++; c->status = ST_WRONG; }
                    wrong[nw++] = list[i];
                    break;
                }
                if (b[0] == 'q' || b[0] == 'Q') { quit = 1; break; }
            }
        }
        for (i = 0; i < nw; i++) list[i] = wrong[i];
        n = nw;
        round++;
    }

    saveProgress();

    {
        int pct = firstAnswered ? firstCorrect * 100 / firstAnswered : 0;
        const char *msg = pct >= 90 ? "Wow! Bravo!" :
                          pct >= 60 ? "Sehr gut!" :
                                      "Dranbleiben, du schaffst das!";
        header(firstAnswered ? msg : "Bis bald!");
        if (firstAnswered) {
            printf("  Beim ersten Versuch gewusst: " C_BOLD C_GREEN "%d" C_RESET " von %d  (%d%%)\n",
                   firstCorrect, firstAnswered, pct);
            if (!quit) printf("  Alle Karten am Ende richtig – super!\n");
            printf(C_GREY "\n  Falsche Karten findest du jetzt unter \"Wiederholen\".\n" C_RESET);
        }
    }
    free(list);
    free(wrong);
    waitEnter();
}

/* ------------------------------------------------------------ Wiederholen */

static void repeatMenu(void) {
    int i, c;
    char b[LEN];
    for (;;) {
        header("Wiederholen macht stark!");
        printf("  " C_GREEN "Gekonnt %d" C_RESET "   " C_RED "Falsch %d" C_RESET "   " C_GREY "Neu %d\n\n  " C_RESET,
               count(-1, MODE_KNOWN), count(-1, MODE_WRONG), count(-1, MODE_NEW));
        progressBar(-1, 40);
        printf("\n\n");
        for (i = 0; i < nCats; i++) {
            printf("  %-24.24s ", cats[i]);
            progressBar(i, 16);
            printf(C_GREEN "  %3d" C_RED " %3d" C_RESET "\n", count(i, MODE_KNOWN), count(i, MODE_WRONG));
        }
        printf(C_GREY "\n  Eine Karte gilt als gekonnt, wenn du sie beim ersten Versuch weißt.\n\n" C_RESET);
        printf("  " C_TEAL "1)" C_RESET " Falsche nochmal üben     " C_GREY "(%d)\n" C_RESET, count(-1, MODE_WRONG));
        printf("  " C_TEAL "2)" C_RESET " Gekonnte wiederholen     " C_GREY "(%d)\n" C_RESET, count(-1, MODE_KNOWN));
        printf("  " C_TEAL "3)" C_RESET " Fortschritt zurücksetzen\n");
        printf("  " C_TEAL "0)" C_RESET " zurück\n");
        c = askNumber("\n  Auswahl: ", 0, 3);
        if (c == 0) return;
        if (c == 1) learn(MODE_WRONG);
        if (c == 2) learn(MODE_KNOWN);
        if (c == 3) {
            printf(C_RED "  Wirklich alles vergessen? (j/n) " C_RESET);
            fflush(stdout);
            if (readLine(b, LEN) && (b[0] == 'j' || b[0] == 'J')) {
                for (i = 0; i < nCards; i++) cards[i].status = ST_NEW;
                saveProgress();
            }
        }
    }
}

/* ------------------------------------------------------------ Wortliste */

static void showList(void) {
    int c, i, pick;
    header("Welche Wörter anzeigen?");
    printf("  " C_TEAL " 0)" C_RESET " Alle\n");
    for (i = 0; i < nCats; i++)
        printf("  " C_TEAL "%2d)" C_RESET " %s " C_GREY "(%d)\n" C_RESET, i + 1, cats[i], count(i, MODE_ALL));
    pick = askNumber("\n  Kategorie: ", 0, nCats) - 1;

    header("Deine Wörter");
    printf(C_GREEN "  ●" C_RESET " gekonnt   " C_RED "●" C_RESET " falsch   " C_GREY "●" C_RESET " neu\n\n");
    for (c = 0; c < nCats; c++) {
        if (pick >= 0 && c != pick) continue;
        printf("  " C_BOLD C_CORAL "%s\n" C_RESET, cats[c]);
        for (i = 0; i < nCards; i++) {
            const char *dot;
            if (cards[i].cat != c) continue;
            dot = cards[i].status == ST_KNOWN ? C_GREEN : cards[i].status == ST_WRONG ? C_RED : C_GREY;
            printf("  %s●" C_RESET " " C_TEAL "%s" C_GREY "  –  " C_RESET "%s\n", dot, cards[i].front, cards[i].back);
        }
        printf("\n");
    }
    waitEnter();
}

/* ------------------------------------------------------------ Wort hinzufügen */

static void noSemicolons(char *s) {
    for (; *s; s++) if (*s == ';') *s = ',';
}

static void addWord(void) {
    char catName[LEN], front[LEN], back[LEN], note[LEN], b[LEN];
    int i, choice;
    FILE *f;

    for (;;) {
        header("Neues Wort? Her damit!");
        for (i = 0; i < nCats; i++)
            printf("  " C_TEAL "%2d)" C_RESET " %s\n", i + 1, cats[i]);
        printf("  " C_TEAL "%2d)" C_RESET " + neue Kategorie\n", nCats + 1);
        printf("  " C_TEAL " 0)" C_RESET " zurück\n");
        choice = askNumber("\n  Kategorie: ", 0, nCats + 1);
        if (choice == 0) return;

        if (choice == nCats + 1) {
            printf("  Name der neuen Kategorie: ");
            fflush(stdout);
            readLine(catName, LEN);
            if (!catName[0]) continue;
        } else {
            copyStr(catName, cats[choice - 1]);
        }
        noSemicolons(catName);

        printf("  %s (lateinische Schrift): ", langNames[curLang]);
        fflush(stdout);
        readLine(front, LEN);
        printf("  Deutsch: ");
        fflush(stdout);
        readLine(back, LEN);
        printf("  Notiz (optional, Enter = keine): ");
        fflush(stdout);
        readLine(note, LEN);
        noSemicolons(front); noSemicolons(back); noSemicolons(note);

        if (!front[0] || !back[0]) {
            printf(C_RED "  Beide Seiten brauchen Text – nichts gespeichert.\n" C_RESET);
        } else {
            f = fopen(langFiles[curLang], "a");
            if (!f) {
                printf(C_RED "  Konnte %s nicht öffnen.\n" C_RESET, langFiles[curLang]);
            } else {
                fprintf(f, "\n[%s]\n%s ; %s", catName, front, back);
                if (note[0]) fprintf(f, " ; %s", note);
                fprintf(f, "\n");
                fclose(f);
                saveProgress();                    /* Fortschritt sichern, dann neu laden */
                loadAll();
                printf(C_GREEN "  Gespeichert! " C_RESET "%s = %s\n", front, back);
            }
        }
        printf("\n  Noch ein Wort? (j/n) ");
        fflush(stdout);
        if (!readLine(b, LEN) || (b[0] != 'j' && b[0] != 'J')) return;
    }
}

/* ------------------------------------------------------------ Sprache wählen */

static void chooseLanguage(void) {
    int i, c;
    loadLanguages();
    header("Welche Sprache?");
    for (i = 0; i < nLangs; i++)
        printf("  " C_TEAL "%d)" C_RESET " %s " C_GREY "(%s)\n" C_RESET, i + 1, langNames[i], langFiles[i]);
    c = askNumber("\n  Sprache: ", 1, nLangs);
    curLang = c - 1;
    if (!loadAll()) {
        printf(C_RED "\n  Datei %s nicht gefunden.\n" C_RESET, langFiles[curLang]);
        printf("  Lege sie neben das Programm (Visual Studio: in den Projektordner).\n");
        waitEnter();
    }
}

/* ------------------------------------------------------------ Hauptmenü */

int main(void) {
    int choice;
    setupConsole();
    srand((unsigned)time(NULL));
    loadLanguages();
    curLang = 0;
    if (nLangs > 1) {
        chooseLanguage();
    } else if (!loadAll()) {
        header("Huch, keine Wörter!");
        printf(C_RED "  %s wurde nicht gefunden.\n" C_RESET, langFiles[curLang]);
        printf("  Lege die .txt-Dateien in denselben Ordner wie das Programm\n");
        printf("  (bei Visual Studio: in den Projektordner neben robbi.c).\n");
        waitEnter();
    }

    for (;;) {
        header("Hallo! Bereit?");
        printf("  " C_TEAL "1)" C_RESET " Karteikarten lernen\n");
        printf("  " C_TEAL "2)" C_RESET " Wiederholen " C_GREY "(%d falsch · %d gekonnt)\n" C_RESET,
               count(-1, MODE_WRONG), count(-1, MODE_KNOWN));
        printf("  " C_TEAL "3)" C_RESET " Wortliste ansehen\n");
        printf("  " C_TEAL "4)" C_RESET " Neues Wort hinzufügen\n");
        printf("  " C_TEAL "5)" C_RESET " Sprache wechseln\n");
        printf("  " C_TEAL "0)" C_RESET " Beenden\n");
        choice = askNumber("\n  Auswahl: ", 0, 5);
        switch (choice) {
            case 1: learn(-1);        break;
            case 2: repeatMenu();     break;
            case 3: showList();       break;
            case 4: addWord();        break;
            case 5: chooseLanguage(); break;
            default:
                header("Bis bald!");
                return 0;
        }
    }
}
