#http://stackoverflow.com/questions/1823762/sendkeys-for-python-3-1-on-windows

import win32api
import win32con
import win32ui
import time,sys

def sendMouseClick(left, right):
    if left:
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)
    if right:
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, x, y, 0, 0)

if __name__ == "__main__":
    win = win32ui.FindWindow(None, sys.argv[1])
    win.SetForegroundWindow()
    win.SetFocus()
    sendMouseClick(sys.argv[2] == "1", sys.argv[3] == "1")
