function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function loadChat(sessionId) {
    fetch(`/load-chat/${sessionId}/`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load chat");
            return response.json();
        })
        .then(data => {
            const chatContainer = document.getElementById("chat-container");
            chatContainer.innerHTML = '';

            data.forEach(item => {
                const msgDiv = document.createElement("div");
                msgDiv.classList.add('flex', 'items-start', 'space-x-2');
                if (item.sender === 'user') {
                    msgDiv.classList.add('justify-end');
                    msgDiv.innerHTML = `<div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs">${item.message}</div>`;
                } else {
                    msgDiv.innerHTML = `<div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">${item.message}</div>`;
                }
                chatContainer.appendChild(msgDiv);
            });

            chatContainer.classList.remove('hidden');  // <== Ensure it's visible
            chatContainer.scrollTop = chatContainer.scrollHeight;
        })
        .catch(error => {
            console.error("Error loading chat:", error);
            alert("Failed to load chat.");
        });
}
