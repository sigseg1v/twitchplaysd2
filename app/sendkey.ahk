keyRepeatDelay = %2%

DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
SetKeyDelay, keyRepeatDelay
target=ahk_class Diablo II

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        ;BlockInput On
        Send %1%
        ;BlockInput Off
    }
}
