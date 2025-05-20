document.addEventListener('DOMContentLoaded', function() {
    initializeFilterFunctionality();
    initializeModals();
    initializeFormHandling();
    initializeFileUpload();
    initializeDeleteFunctionality();
    initializeCreateBotFunctionality();
});


function initializeFilterFunctionality() {
    const filterInput = document.getElementById('filter-bots');
    if (!filterInput) return;

    filterInput.removeEventListener('input', filterBots);
    filterInput.addEventListener('input', filterBots);
}

function filterBots() {
    const query = this.value.toLowerCase();
    const botCards = document.querySelectorAll('.grid > div[class*="group"]');

    botCards.forEach(card => {
        const botName = card.querySelector('h2')?.textContent.toLowerCase() || '';
        const botDescription = card.querySelector('p')?.textContent.toLowerCase() || '';

        if (botName.includes(query) || botDescription.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    updateEmptyState(botCards);
}


function updateEmptyState(botCards) {
    const visibleCards = [...botCards].filter(card => card.style.display !== 'none');
    const emptyStateElement = document.querySelector('.col-span-full:not([data-bot-card])');
    const gridContainer = document.querySelector('.grid');

    if (visibleCards.length === 0 && !emptyStateElement && gridContainer) {
        const emptyState = document.createElement('div');
        emptyState.className = 'col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700';
        emptyState.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No results found</h3>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Try a different search term</p>
        `;
        gridContainer.appendChild(emptyState);
    } else if (visibleCards.length > 0 && emptyStateElement) {
        emptyStateElement.remove();
    }
}

function initializeModals() {
    window.openEditModal = function(botId, botName, botDescription) {
        const modal = document.getElementById('editBotModal');
        if (!modal) return;

        document.getElementById('editBotForm').action = `/bots/${botId}/edit/`;
        document.getElementById('botName').value = botName;
        document.getElementById('botDescription').value = botDescription || '';
        modal.classList.remove('hidden');
    };

    window.closeEditModal = function() {
        const modal = document.getElementById('editBotModal');
        if (modal) modal.classList.add('hidden');
    };

    window.openUploadModal = function(botId, botName) {
        const modal = document.getElementById('uploadPdfModal');
        if (!modal) return;

        document.getElementById('uploadPdfForm').setAttribute('data-bot-id', botId);
        document.getElementById('uploadBotName').textContent = botName;
        document.getElementById('pdfFile').value = '';
        document.getElementById('selectedFileName').textContent = '';
        modal.classList.remove('hidden');
    };

    window.closeUploadModal = function() {
        const modal = document.getElementById('uploadPdfModal');
        if (modal) modal.classList.add('hidden');
    };
}

function initializeFormHandling() {
    const editBotForm = document.getElementById('editBotForm');
    if (editBotForm) {
        editBotForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const actionUrl = this.action;
            const botId = actionUrl.split('/')[4];

            submitFormAsync(actionUrl, formData, (data) => {
                if (data.success) {
                    updateBotCardInfo(botId, formData.get('name'), formData.get('description'));
                    closeEditModal();
                    showNotification('Bot updated successfully!', 'success');
                } else {
                    showNotification(data.error || 'Error updating bot', 'error');
                }
            });
        });
    }
}

function initializeFileUpload() {
    const uploadPdfForm = document.getElementById('uploadPdfForm');
    if (!uploadPdfForm) return;

    const pdfFileInput = document.getElementById('pdfFile');
    const selectedFileName = document.getElementById('selectedFileName');

    if (pdfFileInput && selectedFileName) {
        pdfFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                selectedFileName.textContent = this.files[0].name;
            } else {
                selectedFileName.textContent = '';
            }
        });
    }

    uploadPdfForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const botId = this.getAttribute('data-bot-id');
        const actionUrl = `/bots/${botId}/upload_pdf/`;

        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
            `;
        }

        submitFormAsync(actionUrl, formData, (data) => {
            if (data.success) {
                updateBotAfterPdfUpload(botId);
                closeUploadModal();
                showNotification('PDF uploaded successfully!', 'success');
            } else {
                showNotification(data.error || 'Error uploading PDF', 'error');
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Upload PDF';
            }
        });
    });
}

function submitFormAsync(url, formData, callback) {
    fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        callback(data);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

function updateBotCardInfo(botId, name, description) {
    const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
    if (!botCard) return;

    const nameElement = botCard.querySelector('h2');
    const descriptionElement = botCard.querySelector('p');
    const editButton = botCard.querySelector('button[onclick*="openEditModal"]');
    const uploadButton = botCard.querySelector('button[onclick*="openUploadModal"]');

    if (nameElement) nameElement.textContent = name;
    if (descriptionElement) descriptionElement.textContent = description || 'No description provided.';

    if (editButton) {
        editButton.setAttribute('onclick', `openEditModal('${botId}', '${escapeHtml(name)}', '${escapeHtml(description || '')}')`);
    }

    if (uploadButton) {
        uploadButton.setAttribute('onclick', `openUploadModal('${botId}', '${escapeHtml(name)}')`);
    }
}

function updateBotAfterPdfUpload(botId) {
    const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
    if (!botCard) return;

    const statusBadge = botCard.querySelector('.inline-flex.items-center.px-2\\.5.py-0\\.5.rounded-full');
    if (statusBadge) {
        statusBadge.innerHTML = `
            <svg class="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
            </svg>
            Ready
        `;
        statusBadge.classList.remove('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-800', 'dark:text-yellow-100');
        statusBadge.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-800', 'dark:text-green-100');
    }

    const actionDiv = botCard.querySelector('.flex.items-center.space-x-2');
    const uploadBtn = actionDiv?.querySelector('button[onclick*="openUploadModal"]');
    if (uploadBtn && actionDiv) {
        const chatButton = document.createElement('a');
        chatButton.href = `/chats/chat/${botId}/`;
        chatButton.className = 'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors duration-200';
        chatButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Chat
        `;

        uploadBtn.parentNode.replaceChild(chatButton, uploadBtn);
    }
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    notification.style.opacity = '1';

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function initializeCreateBotFunctionality(){
    const form = document.getElementById('createBotForm');
    if(!form) return;

    form.reset()
    form.addEventListener('submit', function(e){
       e.preventDefault();
       createBot(this);
    });
}

function createBot(form){
    const url = form.action;
    const formData = new FormData(form);
    fetch(url, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    }).then((response)=>{
        return response.json()
    }).then((res)=>{
        if(res.success){
            const data = res.data;
            const botId = data.id;
            const botName = data.name;
            const botDescription = data.description? data.description : "No description provided.";

            const botCard = buildBotCard(botId, botName, botDescription);
            const botList = document.getElementById('bot-container');

            showNotification('Bot created successfully!', 'success');
            botList.insertAdjacentHTML('beforeend', botCard);

            const emptyStateElement = document.querySelector('.col-span-full:not([data-bot-card])');
            if (emptyStateElement) {
                emptyStateElement.remove();
            }

            form.reset();

            refreshEventListeners();
        }

    }).catch((error)=>{
        showNotification('An error occurred while creating the bot.', 'error');
    })
}


function buildBotCard(botId, botName, botDescription) {
    return `
        <div class="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden" data-bot-id='${botId}'>
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 p-3 rounded-lg">
                            <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 break-words">${escapeHtml(botName)}</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 break-words">${escapeHtml(botDescription)}</p>
                        </div>
                    </div>
                    <button type="button"
                            class="edit-bot-btn inline-flex items-center p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                            data-bot-id="${botId}" 
                            data-bot-name="${escapeHtml(botName)}" 
                            data-bot-description="${escapeHtml(botDescription)}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>
                <div class="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4">
                    <div class="flex items-center justify-between">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        <svg class="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Needs PDF
                     </span>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4">
                <div class="flex flex-wrap gap-2">
                    <div class="flex items-center space-x-2">
                            <button type="button"
                                   class="upload-pdf-btn inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                                   data-bot-id="${botId}" 
                                   data-bot-name="${escapeHtml(botName)}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload PDF
                            </button>
                        <form method="post" action="/bots/${botId}/delete/" class="inline delete-bot-form">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
                            <button type="submit"
                                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}



function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function refreshEventListeners() {
    const deleteForms = document.querySelectorAll('form.delete-bot-form:not([data-initialized])');
    deleteForms.forEach(form => {
        form.setAttribute('data-initialized', 'true');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            deleteBot(this);
        });
    });

    const editButtons = document.querySelectorAll('button.edit-bot-btn:not([data-initialized])');
    editButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function() {
            const botId = this.getAttribute('data-bot-id');
            const botName = this.getAttribute('data-bot-name');
            const botDescription = this.getAttribute('data-bot-description');
            openEditModal(botId, botName, botDescription);
        });
    });

    const uploadButtons = document.querySelectorAll('button.upload-pdf-btn:not([data-initialized])');
    uploadButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function() {
            const botId = this.getAttribute('data-bot-id');
            const botName = this.getAttribute('data-bot-name');
            openUploadModal(botId, botName);
        });
    });

    const filterInput = document.getElementById('filter-bots');
    if (filterInput && filterInput.value) {
        filterInput.dispatchEvent(new Event('input'));
    }
}


function initializeDeleteFunctionality() {
    const deleteForms = document.querySelectorAll('form[action*="/delete/"]');

    deleteForms.forEach(form => {
        form.setAttribute('data-initialized', 'true');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            deleteBot(this);
        });
    });
}


function deleteBot(form) {
    
    if (!confirm('Are you sure you want to delete this bot?')) {
        return;
    }

    const url = form.action;
    const formData = new FormData(form);

    fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const botCard = form.closest('[data-bot-id]');
            if (botCard) {
                botCard.remove();
                showNotification('Bot deleted successfully!', 'success');

                const botCards = document.querySelectorAll('.grid > div[class*="group"]');
                updateEmptyState(botCards);
            }
        } else {
            showNotification(data.error || 'Error deleting bot', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while deleting the bot.', 'error');
    });
}



function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}