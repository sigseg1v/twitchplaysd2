DetectHiddenWindows, On
target=ahk_class Diablo II

WinGet, hwnd, ID, %target%
if (!hwnd) {
    Run, "Diablo II.exe" -w, C:\Diablo II
    Sleep, 5000
}
