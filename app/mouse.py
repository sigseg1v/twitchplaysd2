#http://stackoverflow.com/questions/1823762/sendkeys-for-python-3-1-on-windows

import win32api
import win32con
import win32ui
import time,sys

def sendMouse(x, y):
    win32api.SetCursorPos((x, y))

if __name__ == "__main__":
    win = win32ui.FindWindow(None, sys.argv[1])
    win.SetForegroundWindow()
    win.SetFocus()
    sendMouse(sys.argv[2], sys.argv[3])
