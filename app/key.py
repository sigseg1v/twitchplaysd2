#http://stackoverflow.com/questions/1823762/sendkeys-for-python-3-1-on-windows

import win32api
import win32con
import win32ui
import time,sys

keyDelay = 0.1
keymap = {
    "Up": win32con.VK_UP,
    "Left": win32con.VK_LEFT,
    "Down": win32con.VK_DOWN,
    "Right": win32con.VK_RIGHT,
    "Space": win32con.VK_SPACE,
    "Enter": win32con.VK_RETURN,
    "1": 0x31,
    "2": 0x32,
    "3": 0x33,
    "4": 0x34,
    "5": 0x35,
    "6": 0x36,
    "7": 0x37,
    "8": 0x38,
    "9": 0x39,
    "F1": win32con.VK_F1,
    "F2": win32con.VK_F2,
    "F3": win32con.VK_F3,
    "F4": win32con.VK_F4,
    "F5": win32con.VK_F5,
    "F6": win32con.VK_F6,
    "F7": win32con.VK_F7,
    "F8": win32con.VK_F8,
    "Num0": win32con.VK_NUMPAD0,
    "Num1": win32con.VK_NUMPAD1,
    "Num2": win32con.VK_NUMPAD2,
    "Num3": win32con.VK_NUMPAD3,
    "Num4": win32con.VK_NUMPAD4,
    "Num5": win32con.VK_NUMPAD5,
    "Num6": win32con.VK_NUMPAD6,
    "Num7": win32con.VK_NUMPAD7,
    "R": ord("R"),
    "W": ord("W"),
    "S": ord("S"),
    "C": ord("C"),
    "I": ord("I"),
    "T": ord("T"),
    "Tab": win32con.VK_TAB,
    "Q": ord("Q"),
    "O": ord("O")
}

def sendKey(button):
    win32api.keybd_event(keymap[button], 0, 0, 0)
    time.sleep(keyDelay)
    win32api.keybd_event(keymap[button], 0, win32con.KEYEVENTF_KEYUP, 0)

if __name__ == "__main__":
    win = win32ui.FindWindow(None, sys.argv[1])
    win.SetForegroundWindow()
    win.SetFocus()
    sendKey(sys.argv[2])
