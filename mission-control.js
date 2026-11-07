// Mission control
// Update an exercise from IDB
let beeping = false;
let startDate = new Date(localStorage.getItem("launchDate") || "2026-01-01T00:00:00Z"); // starts on 1970 as fallback
let healthAlerts = [];
let culmlativeMsv = 0;
let lastUpdate = new Date();
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
        await beep(600,0.15);
        await new Promise(res => setTimeout(res,10));
    }
};

async function beep(hz, dura) {
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
    await new Promise(res => setTimeout(res,dura*1000));
    ctx.close();

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

function scheduleBeep() {
    if (!beeping) {
        beeping = true;
        tripleBeep();
        setTimeout(() => beeping = false, 3000)
    }
}

function updateCard(ele, abnormal) {
    const card = ele.closest(".card");
    card.classList.toggle("abnormal",abnormal)
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
    // Spo2: 95%;heart rate: 60-100;
    try {
        let msg = e.data;
        const obj = JSON.parse(msg);
        hrEle.textContent = obj.heartRate;
        if (obj.heartRate >= 100 || obj.heartRate < 60) {
            scheduleBeep();
            updateCard(hrEle, true);
            footers[0].textContent = "Heart rate abnormal";
        } else {
            updateCard(hrEle, false);
            footers[0].textContent = "Normal";
        }
        bpEle.textContent = `${obj.bloodPressureSys || "--"}/${obj.bloodPressureDia || "--"} `;
        ctemp.textContent = obj.cabinTemp || "--.-";
        hum.textContent = obj.hum || "--.-";
        radia.rate.textContent = obj.radiaRate || "-.--";
        // calcu
        let timeDifference = new Date().getTime() - lastUpdate.getTime();
        let add = ((obj.radiaRate || 0) * (timeDifference / 3600000)) / 1000;
        culmlativeMsv += add;
        radia.day.textContent = culmlativeMsv.toFixed(2);
        lastUpdate = new Date();
        if (obj.radiaRate >= 10000) {
            footers[5].textContent = "Hazardous";
            scheduleBeep();
            updateCard(radia.rate, true);
        } else if (obj.radiaRate >= 1000) {
            footers[5].textContent = "Hazardous";
            scheduleBeep();
            updateCard(radia.rate, true);
        } else if (obj.radiaRate >= 100) {
            footers[5].textContent = "Warning";
            updateCard(radia.rate, false);
        } else if (obj.radiaRate) {
            footers[5].textContent = "Normal"
            updateCard(radia.rate, false);
        } else {
            footers[5].textContent="Not available";
        }
        cpress.textContent = obj.cabinPressure || "--";
        bo.textContent = obj.spo2 || "--";
        if (obj.spo2 < 95) {
            scheduleBeep();
            updateCard(bo, true);
            footers[7].textContent = "Too low";
        } else {
            updateCard(bo, false); 
        }
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