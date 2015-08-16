SetTitleMatchMode, 2
DetectHiddenWindows, On
SetDefaultMouseSpeed, 0
target=Diablo II
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
        BlockInput On
        Loop %loops% {
            MouseMove, %1%, %2%, 0
            if (%A_Index% > 1) {
                MouseClick, %3%, , , , 0, D
                Sleep 300
                MouseClick, %3%, , , , 0, U
            } else {
                MouseClick, %3%, , , , 0
            }
        }
        BlockInput Off
    }
}
