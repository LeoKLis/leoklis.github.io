const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
window.APP_CONFIG = {
    API_BASE_URL: isLocal 
    ? "http://localhost:8080"
    : "https://api.leoklis.fr"
}

let ws = new WebSocket(`${window.APP_CONFIG.API_BASE_URL}/live-chat`)

ws.addEventListener('open', (ev) => {
    
})

ws.addEventListener('message', (ev) => {
    pushMessage(ev.data)
})

let messageBox = document.getElementById('textarea')

document.addEventListener('keyup', (ev) => {
    if (ev.key == 'Enter' && messageBox.value != "") {
        pushMessage(messageBox.value)
        ws.send(messageBox.value)
        messageBox.value = ""
    }
})

fetch(`${window.APP_CONFIG.API_BASE_URL}/latest-messages`)
    .then((res) => res.json())
    .then((val) => {
        val.latestMessages.forEach(pushMessage)
    })

function pushMessage(messageText) {
    let msg = document.createElement('div')
    msg.classList.add('message')
    let text = messageText;
    if (messageText.startsWith("**") && messageText.endsWith("**")) {
        msg.style.fontStyle = "bold"
        text = messageText.substring(2, messageText.length - 2)
    } else if (messageText.startsWith("*") && messageText.endsWith("*")) {
        msg.style.fontStyle = "italic"
        text = messageText.substring(1, messageText.length - 1)
    }
    msg.innerText = text
    document.getElementById('content').appendChild(msg)

    window.scrollTo(0, document.body.scrollHeight)
}