function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}


function highlightActiveChat(sessionId) {
    document.querySelectorAll("[id^='chat-session-']").forEach(el => {
        el.classList.remove("bg-blue-100", "font-bold", "border-l-4", "border-blue-500");
    });

    const activeEl = document.getElementById(`chat-session-${sessionId}`);
    if (activeEl) {
        activeEl.classList.add("bg-blue-100", "font-bold", "border-l-4", "border-blue-500");
    }
}


function loadChat(session_id) {
    fetch(`/chats/load-chat/${session_id}/`)
        .then(response => response.json())
        .then(data => {
            const chatContainer = document.getElementById("chat-container");
            chatContainer.innerHTML = '';
            data.forEach(item => {
                const msgDiv = document.createElement("div");
                const innerDiv = document.createElement("div");
                msgDiv.classList.add('flex', 'items-start', 'space-x-2');
                innerDiv.classList.add('p-3', 'rounded-lg', 'max-w-xs', 'whitespace-pre-wrap');

                if (item.sender === 'user') {
                    msgDiv.classList.add('justify-end');
                    innerDiv.classList.add('bg-blue-600', 'text-white');
                } else {
                    innerDiv.classList.add('bg-gray-200', 'text-gray-800');
                }

                innerDiv.textContent = item.message;
                msgDiv.appendChild(innerDiv);
                chatContainer.appendChild(msgDiv);
            });
            chatContainer.classList.remove('hidden');
            chatContainer.scrollTop = chatContainer.scrollHeight;

            currentChatId = session_id;
            highlightActiveChat(session_id);
        })
        .catch(error => {
            console.error("Error loading chat:", error);
            alert("Failed to load chat.");
        });
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

    if (document.getElementById(`chat-session-${chatId}`)) return;

    const wrapper = document.createElement('div');
    wrapper.className = "relative flex items-center justify-between px-2 py-2 hover:bg-gray-100 rounded";
    wrapper.id = `chat-session-${chatId}`;

    const titleDiv = document.createElement('div');
    titleDiv.className = "flex-1 cursor-pointer text-left";
    titleDiv.setAttribute("onclick", `loadChat(${chatId})`);
    titleDiv.setAttribute("data-id", chatId);
    titleDiv.id = `chat-click-${chatId}`;

    const span = document.createElement('span');
    span.id = `chat-title-${chatId}`;
    span.className = "truncate";
    span.textContent = chatTitle;
    titleDiv.appendChild(span);

    const settingsWrapper = document.createElement('div');
    settingsWrapper.className = "relative ml-2";
    settingsWrapper.id = `settings-wrapper-${chatId}`;

    const settingsBtn = document.createElement('button');
    settingsBtn.className = "text-gray-500 hover:text-gray-800";
    settingsBtn.innerHTML = "&#8942;";
    settingsBtn.setAttribute("onclick", `toggleMenu(event, ${chatId})`);

    const menuDiv = document.createElement('div');
    menuDiv.id = `menu-${chatId}`;
    menuDiv.className = "absolute right-0 top-6 bg-white border shadow-md rounded hidden z-10 w-32";

    const renameBtn = document.createElement('button');
    renameBtn.className = "block w-full text-left px-4 py-2 hover:bg-gray-100";
    renameBtn.textContent = "Rename";
    renameBtn.setAttribute("onclick", `startRename(${chatId})`);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("onclick", `confirmDelete(${chatId})`);

    menuDiv.appendChild(renameBtn);
    menuDiv.appendChild(deleteBtn);

    settingsWrapper.appendChild(settingsBtn);
    settingsWrapper.appendChild(menuDiv);

    wrapper.appendChild(titleDiv);
    wrapper.appendChild(settingsWrapper);
    chatHistory.prepend(wrapper);

    highlightActiveChat(chatId);
}


function simulateTyping(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'items-start', 'space-x-2');
    if (sender === 'user') {
        messageDiv.classList.add('justify-end');
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add(
        sender === 'user' ? 'bg-blue-600' : 'bg-gray-200',
        sender === 'user' ? 'text-white' : 'text-gray-800',
        'p-3', 'rounded-lg', 'max-w-xs', 'whitespace-pre-wrap'
    );
    contentDiv.textContent = '';
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    let index = 0;
    const interval = setInterval(() => {
        if (index < message.length) {
            contentDiv.textContent += message[index];
            index++;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            clearInterval(interval);
        }
    }, 20);
}

let currentChatId = null;
const botId = document.getElementById("bot-id").value;
let isLoading = false;

function submitMessage() {
    const userInputEl = document.getElementById('user-input');
    const userInput = userInputEl.value.trim();
    const sendBtn = document.querySelector('button[onclick="submitMessage()"]');

    if (userInput === '' || isLoading) return;

    isLoading = true;
    userInputEl.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerText = 'Generating...';

    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.remove('hidden');

    simulateTyping(userInput, 'user');


    const typingDiv = document.createElement('div');
    typingDiv.classList.add('flex', 'items-start', 'space-x-2');
    const typingContent = document.createElement('div');
    typingContent.classList.add('bg-gray-300', 'text-gray-800', 'p-3', 'rounded-lg', 'max-w-xs');
    typingContent.textContent = 'Typing...';
    typingDiv.appendChild(typingContent);
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

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

        chatContainer.removeChild(typingDiv);

        simulateTyping(data.ai_response, 'ai');
        updateSidebar(data.chat_id, data.chat_title);
    })
    .catch(err => {
        console.error("Error saving message:", err);
        typingContent.textContent = "Error generating response.";
    })
    .finally(() => {
        userInputEl.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerText = 'Send';
        userInputEl.value = '';
        adjustHeight(userInputEl);
        isLoading = false;
    });
}

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        if (!event.shiftKey) {
            event.preventDefault();
            submitMessage();
        }
        else {
            return true;
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user-input').addEventListener('keydown', handleKeyDown);
});


function startNewChat() {
    currentChatId = null;
    clearChat();
    highlightActiveChat(null);
}


function toggleMenu(event, sessionId) {
    event.stopPropagation();
    document.querySelectorAll("[id^='menu-']").forEach(menu => menu.classList.add("hidden"));
    const menu = document.getElementById(`menu-${sessionId}`);
    menu.classList.toggle("hidden");

    document.addEventListener("click", () => menu.classList.add("hidden"), { once: true });
}


let renamingChatId = null;

function startRename(sessionId) {
    if (renamingChatId !== null) return;

    renamingChatId = sessionId;

    const titleEl = document.getElementById(`chat-title-${sessionId}`);
    const currentTitle = titleEl.innerText.trim();

    const settingsEl = document.getElementById(`menu-${sessionId}`).parentElement;
    settingsEl.classList.add("hidden");

    titleEl.innerHTML = `
        <input id="rename-input-${sessionId}" type="text" 
               class="border border-blue-400 p-1 text-sm rounded w-full focus:outline-none focus:ring" 
               value="${currentTitle}" 
               onkeydown="if(event.key==='Enter'){ finishRename(${sessionId}) }" 
               onblur="cancelRename(${sessionId}, '${escapeHtml(currentTitle)}')"
               autofocus
        />
    `;

    document.getElementById(`rename-input-${sessionId}`).focus();
}

function finishRename(sessionId) {
    const input = document.getElementById(`rename-input-${sessionId}`);
    const newTitle = input.value.trim();

    if (!newTitle) return cancelRename(sessionId, input.defaultValue);

    fetch(`/chats/rename_chat/${sessionId}/${botId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ title: newTitle }),
    }).then(() => {
        renderChatTitle(sessionId, newTitle);
    });
}

function cancelRename(sessionId, originalTitle) {
    renderChatTitle(sessionId, originalTitle);
}

function renderChatTitle(sessionId, title) {
    const titleEl = document.getElementById(`chat-title-${sessionId}`);
    titleEl.textContent = title;

    const settingsEl = document.getElementById(`menu-${sessionId}`).parentElement;
    settingsEl.classList.remove("hidden");

    renamingChatId = null;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}


function confirmDelete(sessionId) {
    document.getElementById(`menu-${sessionId}`).classList.add("hidden");
    if (confirm("Are you sure you want to delete this chat?")) {
        fetch(`/chats/delete_chat/${sessionId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        }).then(() => {
            const sessionEl = document.getElementById(`chat-session-${sessionId}`);
            if (sessionEl) sessionEl.remove();
        });
    }
}


