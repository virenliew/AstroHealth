import asyncio
import websockets
import json
import math,random
# sampe1 = 80
async def on_connect(ws):
    try:
        task = asyncio.create_task(send(ws))
        async for message in ws:
            # code here
            # bounce the message back,example
            print(message)
            await ws.send(message)
    except websockets.exceptions.ConnectionClosed:
        print("closed")
    finally:
        task.cancel()

    
async def main():
    async with websockets.serve(on_connect, "localhost", 8080):
        await asyncio.Future()

def get_data():
    sample1 = random.randint(81,85)
    return {"heartRate": sample1} # replace it later


async def send(ws):
    try:
        while True:
            await asyncio.sleep(1)
            await ws.send(json.dumps(get_data()))
    except asyncio.CancelledError:
        pass
asyncio.run(main())