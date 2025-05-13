from django.urls import path
from . import views

urlpatterns = [
    path('chat/<int:bot_id>/', views.chat_with_bot, name='chat_with_bot'),
    path('load-chat/<int:session_id>/', views.load_chat, name='load_chat_messages'),
    path('api/save-message/', views.save_message, name='save_message'),
    path('rename_chat/<int:session_id>/<int:bot_id>/', views.rename_chat, name='rename_chat'),
    path('delete_chat/<int:session_id>/', views.delete_chat, name='delete_chat'),

]