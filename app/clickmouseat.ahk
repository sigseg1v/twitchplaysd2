DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
CoordMode, Mouse, Client
target=ahk_class Diablo II

if (%0% < 4 || %0% == "") {
    loops = 1
} else {
    loops = %4%
}

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        ;BlockInput On
        ; move mouse once and click after, so we can have new directional input while this runs
        MouseMove, %1%, %2%, 0
        Loop %loops% {
            ; only click if the window is active right now
            IfWinActive, ahk_id %hwnd%
            {
                MouseClick, %3%, , , , 0
            }
            Sleep 250
        }
        ;BlockInput Off
    }
}
