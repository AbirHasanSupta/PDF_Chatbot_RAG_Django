import json

from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods

from bot_manager.models import Bot
from chat_manager.bot import get_rag_response
from chat_manager.models import ChatSession, ChatMessage


def chat_with_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)
    sessions = ChatSession.objects.filter(user=request.user, bot=bot).order_by('-created_at')
    return render(request, 'chat_manager/chat_conversation.html', {'chat_sessions': sessions, 'bot': bot})


def load_chat(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    messages = session.messages.all().order_by('timestamp')
    data = [{'sender': m.sender, 'message': m.content} for m in messages]
    return JsonResponse(data, safe=False)

@csrf_exempt
@require_POST
def save_message(request):
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

    bot = get_object_or_404(Bot, id=bot_id)
    ai_response = get_rag_response(message, bot)

    ChatMessage.objects.create(
        chat_session=session,
        sender='ai',
        content=ai_response
    )

    return JsonResponse({
        "chat_id": session.id,
        "chat_title": session.created_at.strftime("Chat from %b %d, %H:%M") if not session.title else session.title,
        "ai_response": ai_response
    })

@require_POST
def rename_chat(request, session_id, bot_id):
    chat_session = ChatSession.objects.get(id=session_id)
    new_title = request.POST.get('title', '')
    if new_title:
        chat_session.title = new_title
        chat_session.save()
    return redirect(f'/chats/chat/{bot_id}/')


@require_http_methods(["DELETE"])
@csrf_exempt
def delete_chat(request, session_id):
    ChatSession.objects.filter(id=session_id, user=request.user).delete()
    return JsonResponse({'status': 'deleted'})
