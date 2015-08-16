SetTitleMatchMode, 2
DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
target=Diablo II

WinGet, hwnd, ID, %target%
if (hwnd) {
    WinActivate, ahk_id %hwnd%
    IfWinActive, ahk_id %hwnd%
    {
        MouseMove, %1%, %2%, 0
        MouseClick, %3%
    }
}
