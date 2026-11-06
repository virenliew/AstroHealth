// Mission control
// Update an exercise from IDB
async function updateExercise() {
    // missionControlSock.send()
    let counti = await count(db, "exercise");
    console.log(counti);
    // split
    let remaining = counti;
    let object = {type: "exercise", data: {size: 0,astronaut_id: "123", payload: []}};
    let index = 1;
    if (!missionControlSock || missionControlSock.readyState != WebSocket.OPEN) return;
    while (remaining > 0) {
        let until = Math.min(remaining,10);
        console.log(until)
        for (let i = 0;i < until;i++) {
            let data = await getValue(db, "exercise", index);
            index++;
            object.data.payload.push(data);
            object.data.size++;
            remaining--;

        }
        missionControlSock.send(JSON.stringify(object));
        object.data = {size:0,payload:[]};
    }

}

async function handleWsMcResponse(e) {
    try {
        let msg = e.data;
        const obj = JSON.parse(msg);
        switch(obj) {
            
        }
    } catch(e) {

    }
}

async function handleWsHdResponse(e) {
    let footers = document.querySelectorAll(".health");
    // Vital monitoring
    let hrEle = document.querySelector("#heartRate");
    let bpEle = document.querySelector("#blood_pressure");
    let ctemp = document.querySelector("#temp");
    let hum = document.querySelector("#hum");
    let radia = {rate:document.querySelector("#radiaRate"),day:document.querySelector("#radiaDay")};
    let cpress = document.querySelector("#cabinPres");
    let bo = document.querySelector("#bloodOxygen");
    let spacesuitPress = document.querySelector("#spacesuitPres");
    let btemp = document.querySelector("#btemp");
    try {
        let msg = e.data;
        const obj = JSON.parse(msg);
        hrEle.textContent = obj.heartRate;
        bpEle.textContent = `${obj.bloodPressureSys || "--"}/${obj.bloodPressureDia || "--"} `;
        ctemp.textContent = obj.cabinTemp || "--.-";
        hum.textContent = obj.hum || "--.-";
        radia.rate.textContent = obj.radiaRate || "-.--";
        cpress.textContent = obj.cabinPressure || "--";
        bo.textContent = obj.spo2 || "--";
        spacesuitPress.textContent = obj.spaceSuitPres || "--";
        btemp.textContent = obj.bTemp || "--.-";
        if (!missionControlSock || missionControlSock.readyState != WebSocket.OPEN) return;
        missionControlSock.send(JSON.stringify({
            type: "health_vitals",
            data: {astronaut_id: "123", data: obj}
        }))
    } catch(e) {
        console.log(e);
    }
}

async function  reconnectLoop() {
    if (!connected) {
        // try to reconnect. If fail, set timeout
        try {
            missionControlSock = await openSocket("ws://127.0.0.1:3003/");
            missionControlSock.onclose = () => {console.log("Closed Socket");connected = false;updateConnectStatus(false);reconnectLoop();}
            connected = true;
            updateConnectStatus(true);
            missionControlSock.send(JSON.stringify({
            type: "connect",data: {"astronaut_id": "123"}
        }));
        await updateExercise();
        } catch (err) {
            console.log("cannot connect");
            setTimeout(reconnectLoop, 5000);
        }
        
        
    }
}