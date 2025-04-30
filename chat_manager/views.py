import json
from email.message import Message

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from bot_manager.models import Bot
from chat_manager.models import ChatSession, ChatMessage


def chat_with_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)
    sessions = ChatSession.objects.filter(user=request.user, bot=bot).order_by('-created_at')
    print(sessions)
    return render(request, 'chat_manager/chat_conversation.html', {'chat_sessions': sessions, 'bot': bot})


def load_chat(request, session_id):
    print("Test1")
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    messages = session.messages.all().order_by('timestamp')
    data = [{'sender': m.sender, 'message': m.content} for m in messages]
    print("Test2")
    return JsonResponse(data, safe=False)

@csrf_exempt
@login_required
def save_message(request):
    if request.method == "POST":
        data = json.loads(request.body)

        message = data.get('message', '')
        chat_id = data.get('chat_id')
        bot_id = data.get('bot_id')

        if not chat_id:
            session = ChatSession.objects.create(user=request.user, bot_id=bot_id)
        else:
            session = ChatSession.objects.get(id=chat_id)

        ChatMessage.objects.create(
            chat_session=session,
            sender='user',
            content=message
        )

        ai_response = 'This is a response'

        ChatMessage.objects.create(
            chat_session=session,
            sender='ai',
            content=ai_response
        )

        return JsonResponse({
            "chat_id": session.id,
            "chat_title": session.created_at.strftime("Chat from %b %d, %H:%M"),
            "ai_response": ai_response
        })

