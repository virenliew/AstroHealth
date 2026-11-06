// Mission control
// Update an exercise from IDB
let startDate = new Date(localStorage.getItem("launchDate") || "2026-01-01T00:00:00Z"); // starts on 1970 as fallback
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
        switch(obj.type) {
            case "mission_date":
                startDate = new Date(obj.data);
                localStorage.setItem("launchDate",obj.data);
                break;
        }
    } catch(e) {

    }
}

let tripleBeep = async () => {
    for (let i =0;i<3;i++) {
        beep(600,0.1);await new Promise(res => setTimeout(res,200));
    }
};

function beep(hz, dura) {
    const ctx = new AudioContext();
    oscil = ctx.createOscillator();
    const buf = ctx.createBuffer(1, dura*44100, 44100);
    const dat = buf.getChannelData(0);
    
    for (i=0;i<dura*44100;i++) {
        const angle = Math.PI * 2 * hz * i / 44100;
        dat[i] = Math.sin(angle);
    }
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.connect(ctx.destination);
    source.start();

    // oscil.frequency.value = hz;

} 
setInterval(() => {
    let now = new Date();
    let diff = now.getTime() - startDate.getTime();
    // calculate day
    
    let day = Math.floor(diff / 86400000);
    let msInDay = diff % 86400000;
    let counter = msInDay;
    let h = Math.floor(msInDay / 3600000);
    let m = Math.floor((msInDay % 3600000) / 60000);
    let s = Math.floor(((msInDay % 3600000) % 60000) / 1000);
    console.log(h,m,s);
    let missionCard = document.getElementById("mission-card");
    missionCard.textContent = `Mission Day ${day.toString().padStart(3,"0")},  ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

},1000)

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
    // Spo2: 95%;heart rate: 60-100;
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
            missionControlSock.onmessage = handleWsMcResponse;
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