from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404

from bot_manager.models import Bot
from chat_manager.models import ChatSession


def chat_with_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)
    sessions = ChatSession.objects.filter(user=request.user, bot=bot).order_by('-created_at')
    return render(request, 'chat_manager/chat_conversation.html', {'chat_sessions': sessions, 'bot': bot})


def load_chat(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    messages = session.messages.all().order_by('timestamp')
    data = [{'sender': m.sender, 'message': m.content} for m in messages]
    return JsonResponse(data, safe=False)

