document.addEventListener('DOMContentLoaded', function() {
    const filterInput = document.getElementById('filter-bots');
    const botCards = document.querySelectorAll('.grid > div[class*="group"]');

    if (filterInput) {
        filterInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();

            botCards.forEach(card => {
                const botName = card.querySelector('h2').textContent.toLowerCase();
                const botDescription = card.querySelector('p').textContent.toLowerCase();

                if (botName.includes(query) || botDescription.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });

            const visibleCards = [...botCards].filter(card => card.style.display !== 'none');
            const emptyStateElement = document.querySelector('.col-span-full');

            if (visibleCards.length === 0 && !emptyStateElement) {
                const emptyState = document.createElement('div');
                emptyState.className = 'col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700';
                emptyState.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No results found</h3>
                    <p class="text-gray-500 dark:text-gray-400 mt-1">Try a different search term</p>
                `;
                document.querySelector('.grid').appendChild(emptyState);
            } else if (visibleCards.length > 0 && emptyStateElement) {
                emptyStateElement.remove();
            }
        });
    }
});


function openEditModal(botId, botName, botDescription) {
        document.getElementById('editBotForm').action = `/bots/${botId}/edit/`;

        document.getElementById('botName').value = botName;
        document.getElementById('botDescription').value = botDescription;

        document.getElementById('editBotModal').classList.remove('hidden');
    }

    function closeEditModal() {
        document.getElementById('editBotModal').classList.add('hidden');
    }