import { send } from "process";

document.addEventListener('DOMContentLoaded', async () => {
    const chatBlock = document.getElementById("chatBlock");
    const sendBtn = document.getElementById("sendBtn");
    const promptText = document.getElementById('promptText');

    promptText.focus();

    sendBtn.addEventListener('click', async ()=>{
        const prompt = promptText.value;

        chatBlock.innerHTML += `<br> <strong>USER:</strong> ${prompt} <br>`;
        promptText.value = "";
        promptText.focus();

        const response = await fetch("http://localhost:2137/test", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "prompt": prompt
            })
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        chatBlock.innerHTML += "<strong> GPT:</strong>"

        while(true){
            const {value, done} = await reader?.read();
            if (done) break;

            const chunkText = decoder.decode(value, {stream: true})
            chatBlock.innerHTML += chunkText;
        };

    });
});

