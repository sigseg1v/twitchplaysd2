DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
CoordMode, Mouse, Client
target=ahk_class Diablo II
executeCmd=Diablo II.exe -w -sndbkg
executeDir=C:\Diablo II
SetWorkingDir, %executeDir%

WinGet, hwnd, ID, %target%
if (!hwnd) {
    Run, %executeCmd%
    Sleep, 10000
    WinGet, hwnd, ID, %target%
    if (hwnd) {
        WinSet, AlwaysOnTop, on, ahk_id %hwnd%
        WinActivate, ahk_id %hwnd%
        IfWinActive, ahk_id %hwnd%
        {
            BlockInput On
            MouseMove, 400, 308, 0
            MouseClick, left
            Sleep, 500
            MouseClick, left
            Sleep, 5000
            MouseMove, 175, 125, 0
            MouseClick, left
            MouseClick, left
            Sleep, 500
            MouseClick, left
            MouseClick, left
            Sleep, 5000
            BlockInput Off
        }
    }
}
