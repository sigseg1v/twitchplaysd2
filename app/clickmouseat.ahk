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
        BlockInput On
        Loop %loops% {
            MouseMove, %1%, %2%, 0
            ;if (%A_Index% == %loops%) {
                MouseClick, %3%, , , , 0
                Sleep 250
            ;} else {
            ;    MouseClick, %3%, , , , 0, D
            ;    Sleep 250
            ;    MouseClick, %3%, , , , 0, U
            ;    Sleep 50
            ;}
        }
        BlockInput Off
    }
}
