from django.shortcuts import redirect
from django.urls import reverse


class LoginRequiredMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        excluded_urls = [reverse('login'), reverse('signup')]

        if not request.user.is_authenticated and request.path not in excluded_urls:
            return redirect(f"{reverse('login')}?next={request.path}")

        response = self.get_response(request)
        return response
