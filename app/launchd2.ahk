DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
CoordMode, Mouse, Client
target=ahk_class Diablo II
executeCmd = "Diablo II.exe" -w
executeDir = "C:\Diablo II"

WinGet, hwnd, ID, %target%
if (!hwnd) {
    Run, %executeCmd%, %executeDir%
    Sleep, 5000
    WinGet, hwnd, ID, %target%
    if (hwnd) {
        WinSet, AlwaysOnTop, on, ahk_id %hwnd%
        WinMove, ahk_id %hwnd%, , 0, 0
        WinActivate, ahk_id %hwnd%
        IfWinActive, ahk_id %hwnd%
        {
            BlockInput On
            MouseMove, 400, 308, 0
            MouseClick, left
            Sleep, 100
            MouseClick, left
            Sleep, 5000
            MouseMove, 175, 125, 0
            MouseClick, left
            MouseClick, left
            Sleep, 5000
            BlockInput Off
        }
    }
}
