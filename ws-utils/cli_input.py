import sys
import math
import os
try: 
    import termios
    
    import tty
except ImportError:
    import msvcrt
    print("\x1b[1;32mI\x1b[0;32mnput\x1b[0m")
    print(b'buli')

def get_key():
    if sys.platform == "win32":
        if msvcrt.kbhit():
            ch = msvcrt.getch()
            # print(f"\x1b[34m{ch}\x1b[0m")
            if ch in (b'\xe0'):
                ch2 = msvcrt.getch()
                # print(f"\x1b[32m{ch2}\x1b[0m")
                if ch2 == b'H':
                    # print("__up__") # debugging
                    return "up"
                elif ch2 == b'P':
                    # print("__down__")
                    return "dn"
                elif ch2 == b'K':
                    # print("__left__")
                    return "lf"
                elif ch2 == b'M':
                    # print("__right__")
                    return "rg"
            else:
                # print(ch.decode("utf-8"))
                return ch
        return None
    else:
        pass

def text_input(q, existing = ''):
    cursor = len(existing)
    str1 = existing
    str_a = ''
    str_b = ''
    print(f"\x1b[32m{q}:\x1b[0m")
    # def clear ():
    #     os.system("cls") if sys.platform == "win32" else os.system("clear")
    def set_cursor():
        sys.stdout.write(f"\x1b[{cursor+1}G")
        sys.stdout.flush()
    def clear_line():
        sys.stdout.write("\r"+" "*(len(str1)+1))
    def render():
        clear_line()
        sys.stdout.write(f"\r{str1}\r")
        set_cursor()
    render()
    while True:
        key = get_key()
        if key:
            # print(key)
            if key == "lf" :
                cursor = max(0, cursor-1)
                set_cursor()
            if key == "rg":
                cursor = min(cursor+1, len(str1))
                set_cursor()
            if len(key) == 1:
                if key == b'\x08':
                    clear_line()
                    
                    str_a = str1[:cursor]
                    str_b = str1[cursor:]
                    str_a = str_a[:-1]
                    str1 = str_a+str_b
                    
                    cursor = max(0, cursor-1)
                    render()

                else:
                    k = key.decode("utf-8")
                    # print(str,end='')
                    
                    str_a = str1[:cursor]
                    str_b = str1[cursor:]
                    str1 = str_a+k+str_b
                    cursor += 1
                    render()

                    # print(f"\x1b[{cursor}G",end='')

                    
                if key == b'\r':
                    print()
                    return str1

if __name__ == "__main__":
    print(f"You entered: {text_input(b"Astronaut id\xe3\x81\xae\xf0\x9f\x98\x80".decode("utf-8"), "NASA-001")}")
    # while True:
    #     get_key()
    #     pass