DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
SetKeyDelay, 0
target=ahk_class Diablo II

; Diablo II needs the escape key to resurrect, but we want to be careful that it never keeps the menu open
; so we have a special script to execute it as fast as possible

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        BlockInput On
        SetKeyDelay, 0
        Send {Esc}{Esc}{Space}
        BlockInput Off
    }
}
