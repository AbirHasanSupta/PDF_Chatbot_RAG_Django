document.getElementById('theme-toggle').addEventListener('click', function() {
        document.documentElement.classList.toggle('dark');

        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.remove('dark');
    }

    document.getElementById('mobile-menu-button')?.addEventListener('click', function() {
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenu.classList.toggle('hidden');
    });

document.addEventListener('DOMContentLoaded', function() {
        const messages = document.querySelectorAll('[data-auto-dismiss]');

        messages.forEach(function(message) {
            setTimeout(function() {
                fadeOutMessage(message);
            }, 2000);
        });
    });

    function dismissMessage(button) {
        const message = button.closest('[data-auto-dismiss]');
        fadeOutMessage(message);
    }

    function fadeOutMessage(message) {
        message.classList.remove('opacity-100');
        message.classList.add('opacity-0');

        setTimeout(function() {
            message.remove();
        }, 500);
    }