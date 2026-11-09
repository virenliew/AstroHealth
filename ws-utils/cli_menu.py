import cli_input
import os
import sys

CLEAR = lambda : os.system("cls") if sys.platform == "win32" else os.system("clear")

def show_menu(prompt,keys,last_index=0):
    index = last_index
    CLEAR()
    def draw_key(index,keys):
        CLEAR()
        print(f"\x1b[1;32m{prompt}\x1b[0m")
        for i,v in enumerate(keys):
            print(f"{"> " if index==i else "  "}{v}")
        print("\x1b[47mEnter to select, ESC to cancel\x1b[0m")
    draw_key(index,keys)
    while True:
        key = cli_input.get_key()
        if key == "up":
            index = max(0,index-1)
            draw_key(index,keys)
        elif key == "dn":
            index = min(len(keys)-1,index+1)
            draw_key(index,keys)
        elif key == b"\r":
            return index
        elif key == b"\x1b":
            return None





def cli_view(f):
    CLEAR()
    # call function,an array of key-value
    a = f()
    for k,v in a:
        print(f"\x1b[1m{k}\x1b[0m: {v}")
    print("\x1b[1;47mPress R to refresh,Press ESC to exit\x1b[0m")
    while True:
        key = cli_input.get_key()
        if key == b'r':
            CLEAR()
            a = f()
            for k,v in a:
                print(f"\x1b[1m{k}\x1b[0m: {v}")
            print("\x1b[1;47mPress R to refresh,Press ESC to exit\x1b[0m")
        elif key == b'\x1b':
            break

if __name__ == "__main__":
    import random
    v=1
    while True:
        v = show_menu("Select an action", ["Show data","Nope","Exit"],v)

        if v is not None:
            if v == 0:
                cli_view(lambda : [('a', random.randint(10,20)),('b','\x1b[31mError\x1b[0m')])
            elif v == 2:
                break
        else:
            break