import shutil

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST

from bot_manager.forms import PDFUploadForm
from bot_manager.models import Bot
from chat_manager.bot import setup_vector_store


@require_POST
@login_required(login_url='login')
def create_bot(request):
    name = request.POST.get('bot_name')
    description = request.POST.get('bot_description', '')
    if name:
        Bot.objects.create(user=request.user, name=name, description=description)
    return redirect('bot_list')
    

def bot_list(request):
    bots = Bot.objects.filter(user=request.user)
    return render(request,'bot_manager/bot_list.html', {'bots': bots})


def delete_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)
    bot.delete()
    return redirect('bot_list')


def upload_pdf(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)

    if request.method == "POST":
        form = PDFUploadForm(request.POST, request.FILES)
        if form.is_valid():
            pdf = form.save(commit=False)
            pdf.bot = bot
            pdf.save()

            bot = Bot.objects.prefetch_related('pdfs').get(id=bot.id)

            db_loc = f"./chroma_dbs/bot_{bot.id}"
            shutil.rmtree(db_loc, ignore_errors=True)

            setup_vector_store(bot)

            return redirect('bot_list')
    else:
        form = PDFUploadForm()
    return render(request, 'bot_manager/upload_pdf.html', {'form': form, 'bot': bot})
