SetTitleMatchMode, 2
DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
target=Diablo II

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        Send %1%
    }
}
