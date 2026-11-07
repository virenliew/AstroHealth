import asyncio
import websockets
import json
async def on_connect(ws):
    try:
        
        async for message in ws:
            # code here
            # bounce the message back,example
            # print(message)
            obj = json.loads(message)
            if obj.get("type") == "exercise":
                for d in obj.get("data").get("payload"):
                    print(f"#{d.get("id")} Type: {d.get("eType")};mission day: day {d.get("missionDay")}; duration: {d.get("duration")} minutes; Avg Heart Rate: {d}")
            await ws.send(json.dumps({'type': "mission_date", 'data': "2026-07-01T00:00:00Z"}))
    except websockets.exceptions.ConnectionClosed:
        print("closed")
    
async def main():
    async with websockets.serve(on_connect, "localhost", 3003):
        await asyncio.Future()
asyncio.run(main())