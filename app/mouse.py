import win32api
import win32con
import win32gui
import time,sys
import ctypes

MOUSEEVENTF_MOVE = 0x0001 # mouse move
MOUSEEVENTF_ABSOLUTE = 0x8000 # absolute move
MOUSEEVENTF_MOVEABS = MOUSEEVENTF_MOVE + MOUSEEVENTF_ABSOLUTE

MOUSEEVENTF_LEFTDOWN = 0x0002 # left button down
MOUSEEVENTF_LEFTUP = 0x0004 # left button up
MOUSEEVENTF_CLICK = MOUSEEVENTF_LEFTDOWN + MOUSEEVENTF_LEFTUP

MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_RCLICK = MOUSEEVENTF_RIGHTDOWN + MOUSEEVENTF_RIGHTUP

def sendMouse(x, y):
    x = 65536L * x / ctypes.windll.user32.GetSystemMetrics(0) + 1
    y = 65536L * y / ctypes.windll.user32.GetSystemMetrics(1) + 1
    ctypes.windll.user32.mouse_event(MOUSEEVENTF_MOVEABS, x, y, 0, 0)

def sendMouseClick(left, right):
    if left:
        ctypes.windll.user32.mouse_event(MOUSEEVENTF_CLICK, 0, 0, 0, 0)
    if right:
        ctypes.windll.user32.mouse_event(MOUSEEVENTF_RCLICK, 0, 0, 0, 0)

if __name__ == "__main__":
    hwnd = win32gui.FindWindow(None, sys.argv[1])
    (x_tl, y_tl, x_br, y_br) = win32gui.GetWindowRect(hwnd)
    (c_x_tl, c_y_tl, c_x_br, c_y_br) = win32gui.GetClientRect(hwnd)
    innerWidth = c_x_br - c_x_tl
    innerHeight = c_y_br - c_y_tl
    topLeft_x = x_br - innerWidth
    topLeft_y = y_br - innerHeight
    sendMouse(int(sys.argv[2]) + topLeft_x, int(sys.argv[3]) + topLeft_y)
    sendMouseClick(sys.argv[4] == "1", sys.argv[5] == "1")
