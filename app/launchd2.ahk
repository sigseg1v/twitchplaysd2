DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
CoordMode, Mouse, Client
target=ahk_class Diablo II

WinGet, hwnd, ID, %target%
if (!hwnd) {
    Run, "Diablo II.exe" -w, C:\Diablo II
    Sleep, 5000
    WinGet, hwnd, ID, %target%
    if (hwnd) {
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
