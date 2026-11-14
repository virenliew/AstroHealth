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
red_string = lambda x : f"\x1b[31m{x}\x1b[0m"
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
                    print(f"#{d.get("id")} astronaut {obj.get("data").get("astronaut_id")} Type: {d.get("eType")};mission day: day {d.get("missionDay")}; duration: {d.get("duration")} minutes; Avg Heart Rate: {d.get("avgHR")}")
                    if not d.get("sent",False):
                        astronaut_portfolio["exercise"].append(d)
                os.makedirs("./storage", exist_ok=True)
                with open("./storage/astronaut_exercises.json",'w') as f:
                    json.dump(exercise, f,indent=2)
            elif obj.get("type") == "health_vitals":
                data = obj.get("data").get("data")
                hr = data["heartRate"]
                print(f"Heart rate:{red_string(hr) if hr < 60 or hr>100 else hr}")
            elif obj.get("type") == "login":
                with open("./storage/astronaut.json","r") as f:
                    obj1 = json.load(f)
                    for a in obj1:
                        auth = False
                        if a["username"] == obj["data"]["username"]:
                            print("username exist")
                            if a["password"] == obj["data"]["password"]:
                                auth = True
                                await ws.send(json.dumps({'type':'authorize','astroId': obj["data"]["username"]}))
                                break
                    if not auth:
                        await ws.send(json.dumps({'type':'authorize_err','message':'incorrect username or password'}))

                        
            await ws.send(json.dumps({'type': "mission_date", 'data': "2026-07-01T00:00:00Z"}))
    except websockets.exceptions.ConnectionClosed:
        print("closed")
    
async def main():
    async with websockets.serve(on_connect, "localhost", 3003):
        await asyncio.Future()
asyncio.run(main())