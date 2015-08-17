DetectHiddenWindows, On
target=ahk_class Diablo II

WinGet, hwnd, ID, %target%
if (hwnd) {
    FileAppend, 0, *
} else {
    FileAppend, 1, *
}
