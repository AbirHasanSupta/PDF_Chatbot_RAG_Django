from django.urls import path
from . import views

urlpatterns = [
    path('chat/<int:bot_id>', views.chat_with_bot, name='chat_with_bot'),
    path('load-chat/<int:session_id>', views.load_chat, name='load_chat_messages'),
]