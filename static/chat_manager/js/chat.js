function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function loadChat(session_id) {
    fetch(`/chats/load-chat/${session_id}/`)
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

            chatContainer.classList.remove('hidden');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        })
        .catch(error => {
            console.error("Error loading chat:", error);
            alert("Failed to load chat.");
        });
}

function appendMessage(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'items-start', 'space-x-2');

    if (sender === 'user') {
        messageDiv.classList.add('justify-end');
        messageDiv.innerHTML = ` 
            <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                ${message}
            </div>
        `;
    } else {
        messageDiv.innerHTML = ` 
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">
                ${message}
            </div>
        `;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
}

function getCSRFToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

function updateSidebar(chatId, chatTitle) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory.querySelector(`[data-id="${chatId}"]`)) {
        const btn = document.createElement('button');
        btn.setAttribute('data-id', chatId);
        btn.classList.add('text-left', 'w-full', 'py-2', 'px-4', 'hover:bg-gray-100', 'rounded');
        btn.innerText = chatTitle;
        btn.onclick = () => loadChat(chatId);
        chatHistory.prepend(btn);
    }
}

let currentChatId = null;
const botId = document.getElementById("bot-id").value;

function submitMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput === '') return;

    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.remove('hidden');
    appendMessage(userInput, 'user');

    fetch('/chats/api/save-message/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            message: userInput,
            chat_id: currentChatId,
            bot_id: botId,
        }),
    })
    .then(res => res.json())
    .then(data => {
        currentChatId = data.chat_id;
        appendMessage(data.ai_response, 'ai');
        updateSidebar(data.chat_id, data.chat_title);
    });

    document.getElementById('user-input').value = '';
    adjustHeight(document.getElementById('user-input'));
}