document.addEventListener('DOMContentLoaded', async () => {
    const chatBlock = document.getElementById("chatBlock");
    const promptForm = document.getElementById('promptForm');
    const promptText = document.getElementById('promptText');

    promptText.focus();

    promptForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(promptForm);
        const prompt = formData.get('promptText');
        promptForm.reset();

        chatBlock.innerHTML += `<br> <strong>USER:</strong>`;
        chatBlock.innerHTML += prompt;
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

        chatBlock.innerHTML += "<br><strong> GPT:</strong>"

        while(true){
            const {value, done} = await reader?.read();
            if (done) break;

            const chunkText = decoder.decode(value, {stream: true})
            chatBlock.innerHTML += chunkText;
        };

    });
});

