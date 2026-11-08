import asyncio
import websockets
import json
import os
print("\x1b[1;32mMission control active\x1b[0m")

def find_astronaut(storageJson, id):
    for i in storageJson:
        if i["astronaut_id"] == id:
            return i
    return None
async def on_connect(ws):
    try:
        
        async for message in ws:
            # code here
            # bounce the message back,example
            # print(message)
            obj = json.loads(message)
            global exercise, astronaut_portfolio
            exercise = []
            astronaut_portfolio = None
            
            if obj.get("type") == "exercise":
                if os.path.exists("./storage/astronaut_exercises.json"):
                    with open("./storage/astronaut_exercises.json",'r') as f:
                        exercise = json.load(f)
                        astronaut_portfolio = find_astronaut(exercise,obj.get("data").get("astronaut_id"))
                        if not astronaut_portfolio:
                            astronaut_portfolio = {'astronaut_id': obj.get("data").get("astronaut_id"),'exercise':[]}
                            exercise.append(astronaut_portfolio)
                else:
                    astronaut_portfolio = {'astronaut_id': obj.get("data").get("astronaut_id"),'exercise':[]}
                    exercise.append(astronaut_portfolio)
                print(obj.get("data").get("astronaut_id"))
                for d in obj.get("data").get("payload"):
                    print(f"#{d.get("id")} Type: {d.get("eType")};mission day: day {d.get("missionDay")}; duration: {d.get("duration")} minutes; Avg Heart Rate: {d}")
                    if not d.get("sent",False):
                        astronaut_portfolio["exercise"].append(d)
                os.makedirs("./storage", exist_ok=True)
                with open("./storage/astronaut_exercises.json",'w') as f:
                    json.dump(exercise, f,indent=2)
            await ws.send(json.dumps({'type': "mission_date", 'data': "2026-07-01T00:00:00Z"}))
    except websockets.exceptions.ConnectionClosed:
        print("closed")
    
async def main():
    async with websockets.serve(on_connect, "localhost", 3003):
        await asyncio.Future()
asyncio.run(main())