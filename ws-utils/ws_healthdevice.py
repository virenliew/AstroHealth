import asyncio
import websockets
import json
import math,random
import cli_menu
# sampe1 = 80
selected = 0
async def on_connect(ws):
    try:
        task = asyncio.create_task(send(ws))
        async for message in ws:
            # never receive message, one-way only. Ignore
            pass
    except websockets.exceptions.ConnectionClosed:
        print("closed")
    finally:
        task.cancel()

    
async def main():
    async with websockets.serve(on_connect, "localhost", 8080):
        await asyncio.Future()

def get_data():
    sample1 = random.randint(90,96)
    # sample1 = 101
    if selected==0:
        return {"heartRate": sample1,"spo2": 99, "radiaRate":random.randint(63,68), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": 24, "hum": 50,"spaceSuitPres": 28} # replace it later
    elif selected==1:
        return {"heartRate": sample1,"spo2": 99, "radiaRate":random.randint(63,68), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": 24, "hum": random.randint(18,20),"spaceSuitPres": None} # replace it later
    elif selected==2:
        return {"heartRate": random.randint(32,38),"spo2": 92, "radiaRate":random.randint(63,68), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": 24, "hum": 50,"spaceSuitPres": None} # replace it later
    elif selected==3:
        return {"heartRate": sample1,"spo2": 99, "radiaRate":random.randint(63,68), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": 24, "hum": random.randint(72,80),"spaceSuitPres": None} # replace it later
    elif selected==4:
        return {"heartRate": sample1,"spo2": 99, "radiaRate":random.randint(1714,1988), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": 24, "hum": 50,"spaceSuitPres": None} # replace it later
    elif selected==5:
        return {"heartRate": sample1,"spo2": 99, "radiaRate":random.randint(63,68), "bTemp": random.randint(41,44), "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": 96,"cabinTemp": random.randint(32,35), "hum": 50,"spaceSuitPres": None} # replace it later
    elif selected==6:
        return {"heartRate": random.randint(32,38),"spo2": 87, "radiaRate":random.randint(63,68), "bTemp": 36.1, "bloodPressureSys": 101, "bloodPressureDia": 75,"cabinPressure": random.randint(23,26),"cabinTemp": 24, "hum": 3,"spaceSuitPres": None} # replace it later
    elif selected == 7:
        return {"heartRate": random.randint(100,150),"spo2": random.randint(90,99), "radiaRate":random.randint(63,68), "bTemp": random.randint(38,42), "bloodPressureSys": random.randint(100,130), "bloodPressureDia": random.randint(70,100),"cabinPressure": random.randint(30,40),"cabinTemp": random.randint(10,20), "hum": random.randint(60,90),"spaceSuitPres": random.randint(30,40)} # replace it later
        


async def send(ws):
    try:
        while True:
            await asyncio.sleep(1)
            await ws.send(json.dumps(get_data()))
    except asyncio.CancelledError:
        pass

SIMULATION = ["Normal","Dry","Hypoxia", "Wet", "Radiation", "High temperature", "Decompression","Random"]
selected = cli_menu.show_menu("Select a simulation",SIMULATION,7)
print(f"Selected: {SIMULATION[selected]}")
asyncio.run(main())