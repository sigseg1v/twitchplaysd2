DetectHiddenWindows, On
SetKeyDelay, keyRepeatDelay
target=ahk_class Diablo II

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        ;BlockInput On
        Send {Shift down}
        Sleep, 5000
        Send {Shift up}
        ;BlockInput Off
    }
}
