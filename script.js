let cards = document.querySelectorAll(".health-panel");
let tabBtn = document.querySelectorAll(".tab-btn");
let startOffset = document.querySelector("header").getBoundingClientRect().height;
let scrollActive = false;
const idb = indexedDB;
let req = null;
let db = null;
let exerciseChart = null;
let missionControlSock = null;
let healthFeedSocket = null;
let connected = false;
let connectBtn = document.querySelector("#connect-device");
let connectUrl = "";

// Navigation
function tab(n) {
    scrollActive = true;
    window.scrollBy(0, cards[n].getBoundingClientRect().y - startOffset);
    
    // setTimeout(() => {scrollActive = false}, 1000);
    pushState(cards[n]);
}
window.addEventListener("popstate",(e) => {
    // e.preventDefault();
    // if (e.state) {
        const hash = window.location.hash;
        let ele = document.querySelector(hash);
        if (ele) {
            scrollActive = true;
            window.scrollTo(0, ele.getBoundingClientRect().y - startOffset);
        }
        console.log(window.location.hash);
    // }
    console.log("popstate")
});
function pushState(elem) {
    history.pushState("","",`#${elem.id}`);
}

function updateConnectStatus(connect) {
    let dot = document.querySelector(".status-dot");
    let status = document.querySelector("#connect-status");
    connect ? dot.classList.add("connected") : dot.classList.remove("connected");
    status.textContent = connect ? "Online" : "Offline"
}

// IndexedDB Helpers
function getValue(db, objName, key) {
    return new Promise((res,rej) => {
        const trans = db.transaction(objName, "readonly");
        const store = trans.objectStore(objName);
        const req = store.get(key);
        req.onsuccess = (e) => res(e.target.result);
        req.onerror = (e) => rej(e.target.error);
    })
}

function appendValue(db, objName, value) {
    return new Promise((res,rej) => {
        const trans = db.transaction(objName, "readwrite");
        const store = trans.objectStore(objName);
        const req = store.add(value);
        req.onsuccess = (e) => res(e.target.result);
        req.onerror = (e) => rej(e.target.error);
    })
}

function changeValue(db, objName, value) {
    return new Promise((res,rej) => {
        const trans = db.transaction(objName, "readwrite");
        const store = trans.objectStore(objName);
        const req = store.put(value);
        req.onsuccess = (e) => res(e.target.result);
        req.onerror = (e) => rej(e.target.error);
    })
}
function count(db, objName) {
    return new Promise((res,rej) => {
        const trans = db.transaction(objName, "readonly");
        const store = trans.objectStore(objName);
        const req = store.count();
        req.onsuccess = (e) => res(e.target.result);
        req.onerror = (e) => rej(e.target.error);
    })
}

async function markSent(db, objName, start, end) {
    for (let i = start;i<=end;i++){
        const obj = await getValue(db, objName,i);
        obj.sent = true;
        await changeValue(db,objName, obj);
    }
}

function openIdb(name) {
    return new Promise((res,rej) => {
        req = idb.open(name, 1);
        req.onerror = (e) => {rej(e)};
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            const store = setupStore(db, "exercise");
            setupStore(db,"sleep");
            setupStore(db,"health_records");
            setupStore(db,"medication");
            // res(db)
        }
        req.onsuccess = (e) => {
            const db = e.target.result;
            // setupStore(db, "exercise");
            res(db);
        }
    })
    
}

function resetExercise(db) {
    // close
    // db.close();
    return new Promise((res,rej) => {
        const trans = db.transaction("exercise", "readwrite");
        const store = trans.objectStore("exercise");
        const req2 = store.add({
            eType: "",missionDay: '', duration: "0",avgHR: "0",id:0
        });
        req2.onsuccess = (e) => {
            const trans = db.transaction("exercise", "readwrite");
            const store = trans.objectStore("exercise");
            const req = store.clear();
            req.onsuccess = (e) => res(e.target.result);
            req.onerror = (e) => rej(e.target.error);
        };
        req2.onerror = (e) => rej(e.target.error);
        
    })
}

function setupStore(db, name) {
    if (!db.objectStoreNames.contains(name)) {
        return db.createObjectStore(name, {keyPath: "id",autoIncrement:false});
    }
    return null;
}

// ui
function showModal(title, text, onConfirm,btnTxt = "OK", btnColor = "#ccc", showCancel = true) {
    const modal = document.getElementsByClassName("modal")[0];
    modal.classList.remove("hidden");
    const mTitle = modal.querySelector("#modal-title");
    const mMsg = modal.querySelector("#modal-msg");
    mTitle.textContent = title;
    mMsg.textContent = text;
    
    const card = modal.querySelector(".card");
    card.classList.remove("anim-close-modal");
    card.classList.add("anim-open-modal");
    const cancel = modal.querySelector("#modal-cancel");
    cancel.style.display = showCancel ? "block" : "none"
    const confirm = modal.querySelector("#modal-confirm");
    let closeModal = () => {
        card.classList.remove("anim-open-modal");
        card.classList.add("anim-close-modal");
        setTimeout(() => modal.classList.add("hidden"),400);
        cancel.removeEventListener('click', closeModal);
        confirm.removeEventListener("click", execute);
    };
    cancel.addEventListener('click', closeModal);
    let execute = () => {
        onConfirm();
        closeModal()
        confirm.removeEventListener("click", execute);
        cancel.removeEventListener('click', closeModal);
    }
    confirm.addEventListener("click", execute);
    confirm.textContent = btnTxt;
    confirm.style.backgroundColor = btnColor;
}



document.querySelector("#delete-exercise").addEventListener("click",(e) => {
    showModal("Archive Exercises", "Are you sure you want to archive all exercises? Your exercises is still visible in Mission Control", async () => {
        console.log('delete');
        resetExercise(db);
        await fillExerciseTable();
        const data = await exerciseChartCalculate();
        updateChart(exerciseChart, data.labels, data.values);
    });
}) 


document.querySelector("#add-exercise").addEventListener('submit', async (e) => {
    e.preventDefault();
    let err = document.getElementById("err-save");
    let successCard = document.getElementById("suc-save");
    let errTxt = document.getElementById("err-msg-save");
    let type = document.getElementById("etype").value;
    if (type == 'null'){
        err.classList.remove('hidden');
        errTxt.textContent = "Please select an exercise on the top.";
        document.getElementById("etype").focus();
        document.querySelector("#add-exercise").scrollIntoView();
        successCard.classList.add("hidden");
        tripleBeep();
        return;
    }
    let missionDay = document.getElementById("mission-day").value;
    let duration = document.getElementById("duration").value;
    let hr = "72";


    try {
        const save = {
            eType: type,missionDay: missionDay, duration: duration,avgHR: hr,id: await count(db,"exercise")+1
        }
        console.log(save)
        await appendValue(db, "exercise", save);
        err.classList.add('hidden');
        successCard.classList.remove("hidden");
        await fillExerciseTable();
        const data = await exerciseChartCalculate();
        updateChart(exerciseChart, data.labels, data.values);
        await updateExercise();
        showModal("Exercise Saved", "Exercise has been saved.", () => {console.log()}, "OK", "#0f0", false);
    } catch(e) {
        err.classList.remove('hidden');
        errTxt.textContent = `Failed to save to database: ${e}`;
        document.querySelector("#add-exercise").scrollIntoView();
        successCard.classList.add("hidden");
    }
    document.querySelector("#add-exercise").reset();

})

connectBtn.addEventListener('click',async ()=> {
    let hostname = document.querySelector("#hostname").value;
    localStorage.setItem("hDeviceHost", hostname);
    connectUrl = "";
    if (hostname == "localhost") {
        connectUrl = "ws://localhost:8080";
    } else {
        connectUrl = `ws://${hostname}.local:8080`;
    }
    if (hostname != "") connectHDLoop();

})

document.querySelector("#add-sleep").addEventListener("submit",async (e) => {
    e.preventDefault();
    let dura = document.getElementById("sleep-duration");
    let awakening = document.getElementById("sleep-awake");
    let quality = document.getElementById("sleep-quality");
    try {
        const save = {
            duration: parseFloat(dura.value),awakening: parseInt(awakening.value),sleepQuality: parseInt(quality.value),missionDay:missionDay,id: await count(db,"sleep")+1
        }
        console.log(save)
        await appendValue(db, "sleep", save);
        await fillTable("sleep","sleepTable",(obj) => {return [obj.missionDay,obj.duration,obj.awakening,obj.sleepQuality]});
        showModal("Sleep record Saved", "Sleep record has been saved.", () => {console.log()}, "OK", "#0f0", false);
    } catch(e) {
        showModal("Sleep record Failed", "Failed to save sleep record: "+e, () => {console.log()}, "OK", "#0f0", false);
        console.error(e)
    }
    document.querySelector("#add-exercise").reset();
})

document.addEventListener("scroll",(e) => {
    // console.log(document.querySelector("header").getBoundingClientRect().top - startOffset);
    // console.log(cards[1].getBoundingClientRect().top - startOffset);
    // console.log(cards[2].getBoundingClientRect().top - startOffset);
    // from the last card
    if (!scrollActive) {
        let index = 0;
        for (i = cards.length - 1;i > 0;i--) {
            if (cards[i].getBoundingClientRect().top - startOffset <= 0) {
                index = i;
                break;
            }
            // console.log(i);
        }
        console.log(index)
        tabBtn.forEach((v)=> {
            v.classList.remove("active");
        })
        tabBtn[index].classList.add("active");
    }
    
})

document.addEventListener("scrollend", (e) => {
    // console.log(document.querySelector("header").getBoundingClientRect().top - startOffset);
    // console.log(cards[1].getBoundingClientRect().top - startOffset);
    // console.log(cards[2].getBoundingClientRect().top - startOffset);
    // from the last card
    if (!scrollActive) {
        let index = 0;
        for (i = cards.length - 1;i > 0;i--) {
            if (cards[i].getBoundingClientRect().top - startOffset <= 0) {
                index = i;
                break;
            }
        }
        console.log(index)
        pushState(cards[index]);
        console.log("scroll end");
    }
    scrollActive = false;
    
})

tabBtn.forEach((v, i) => {
    v.addEventListener("click", () => {
        tab(i);
        tabBtn.forEach((v)=> {
            v.classList.remove("active");
        })
        v.classList.add("active");
    })
})

// pushState(cards[1]);

async function fillExerciseTable() {
    let table = document.getElementById("exercise-data");
    let items = await count(db,"exercise");
    console.log(items);
    // populate table
    table.innerHTML = "";
    for (let i = 0;i < items;i++) {
        let result = await getValue(db, "exercise", i+1);
        console.log(result);
        if (result !== null && result !== undefined) {
            table.innerHTML += `<tr><td>${result.id}</td><td>Day ${result.missionDay}</td><td>${result.eType}</td><td>${result.duration} min</td><td>${result.avgHR}</td></tr>`;
        }
    }
}

async function fillTable(dbName, tableId,insertCb) {
    let table = document.getElementById(tableId);
    let items = await count(db,dbName);
    console.log(items);
    // populate table
    table.innerHTML = "";
    let row = ""
    for (let i = 0;i < items;i++) {
        row = "";
        let result = await getValue(db, dbName, i+1);
        console.log(result);
        if (result !== null && result !== undefined) {
            row += `<tr>`;
            insertCb(result).forEach((v,i) => {
                row += `<td>${v}</td>`;
            })
            row += `</tr>`;
            table.innerHTML += row;
            console.log(i);
        }
    }
}

function setupBarChart(canvasElem, type, labels, dataName, dataValue) {
    return new Chart(canvasElem.getContext('2d'), {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: dataName,
                data: dataValue,
                backgroundColor: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#7fa6f8" :"#002aff2f",
                borderColor: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "000000",
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x:{ticks:{color:"#ffffff"},grid:{color:"#ffffff"},title:{
                    display:true,text:"Mission Day",color:"#fff",font: {family: 'Nunito',weight:"bold"}
                }},
                
                y:{ticks:{color:"#ffffff"},grid:{color:"#ffffff"}}
            }, 
            plugins:{legend:{labels:{color:"#ffffff",font: {family: 'Nunito'}}}}
            
        }
        

    })
}

function updateChart(chart,label,data) {
    chart.data.datasets[0].data = data;
    chart.data.labels = label;
    chart.update();
}

async function exerciseChartCalculate() {
    let data = {
        labels: [],
        values: []
    }
    let items = await count(db, "exercise");
    console.log(items);
    // populate table
    for (i = 0;i < items;i++) {
        let result = await getValue(db, "exercise", i+1);
        console.log(result);
        if (result !== null && result !== undefined) {
            let missionIndex = data.labels.indexOf(result.missionDay);
            if (missionIndex == -1) {
                data.labels.push(result.missionDay);
                missionIndex = data.labels.indexOf(result.missionDay);
                data.values[missionIndex] = 0;
            }
            
            data.values[missionIndex]++;
        }
    }
    console.log(data);
    
    return data;
}

function openSocket(wsUrl) {
    return new Promise((res,rej) => {
        let ws = new WebSocket(wsUrl);
        ws.onopen = () => {res(ws)};
        ws.onerror = (e) => {rej(e)};
    })   
}

async function connectHDLoop() {
    if (!healthFeedSocket || healthFeedSocket.state != WebSocket.OPEN) {
        try{
            connectBtn.textContent = "Reconnecting...";
            healthFeedSocket = await openSocket(connectUrl);
            healthFeedSocket.onclose = () => {console.log("Closed Socket");connected = false;connectBtn.textContent = "Disconnected";connectHDLoop();};
            healthFeedSocket.onmessage = handleWsHdResponse;
            connectBtn.textContent = "Connected";
        } catch(e) {
            console.log("cannot connect")
            ;setTimeout(connectHDLoop, 5000);
        }
        

    }
}

(async () => {
    db = await openIdb("astronaut");
    if ('scrollRestoration' in history) {
        history.scrollRestoration = "auto";
    }
    try {
        data = await exerciseChartCalculate();
        exerciseChart = setupBarChart(document.getElementById("exerciseRecords"), "bar", data.labels, "Number of Exercises in Mission Day", data.values);
        
    } catch(e) {
        console.log(e);
    }
    await fillExerciseTable();
    await fillTable("sleep","sleepTable",(obj) => {return [obj.missionDay,obj.duration,obj.awakening,obj.sleepQuality]});
    // count exercise in mission
    
    await new Promise((res) => setTimeout(res, 1000));
    try {
        missionControlSock = await openSocket("ws://127.0.0.1:3003/");
        missionControlSock.onclose = () => {console.log("Closed Socket");connected = false;updateConnectStatus(false);reconnectLoop();}
        missionControlSock.onmessage = handleWsMcResponse;
        connected = true;
        updateConnectStatus(true);
    } catch (err) {
        console.log("Disconnected");
        reconnectLoop();
    }
    try {
        let hostname = localStorage.getItem("hDeviceHost") || "";
        document.querySelector("#hostname").value = hostname;
        connectUrl = "";
        if (hostname == "localhost") {
            connectUrl = "ws://localhost:8080";
        } else {
            connectUrl = `ws://${hostname}.local:8080`;
        }
        if (hostname != "") connectHDLoop();
    } catch(err) {
        console.log("Disconnected health device - trying reconnect");
    }
    
    missionControlSock.send(JSON.stringify({
        type: "connect",data: {"astronaut_id": "123"}
    }));
    await updateExercise();
})();
