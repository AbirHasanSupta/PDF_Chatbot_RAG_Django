import os
import shutil

from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST

from bot_manager.forms import PDFUploadForm
from bot_manager.models import Bot
from chat_manager.bot import setup_vector_store


@require_POST
def create_bot(request):
    name = request.POST.get('bot_name')
    description = request.POST.get('bot_description', '')
    if name:
        Bot.objects.create(user=request.user, name=name, description=description)
        messages.success(request, f"'{name}' has been created successfully!")
    return redirect('bot_list')
    

def bot_list(request):
    bots = Bot.objects.filter(user=request.user)
    return render(request,'bot_manager/bot_list.html', {'bots': bots})


def edit_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)

    if request.method == "POST":
        bot.name = request.POST.get('name')
        bot.description = request.POST.get('description')
        bot.save()

        messages.success(request, f"'{bot.name}' has been updated successfully!")

        return redirect('bot_list')

    return redirect('bot_list')

def delete_bot(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)

    if hasattr(bot, 'pdf') and bot.pdf:
        if bot.pdf.file and os.path.isfile(bot.pdf.file.path):
            os.remove(bot.pdf.file.path)

    db_loc = f"./chroma_dbs/bot_{bot.id}"
    shutil.rmtree(db_loc, ignore_errors=True)

    bot.delete()
    messages.success(request, f"'{bot.name}' has been deleted successfully!")
    return redirect('bot_list')


def upload_pdf(request, bot_id):
    bot = get_object_or_404(Bot, id=bot_id, user=request.user)

    if request.method == "POST":
        form = PDFUploadForm(request.POST, request.FILES)
        if form.is_valid():
            pdf = form.save(commit=False)

            if hasattr(bot, 'pdf'):
                bot.pdf.delete()
            pdf.bot = bot
            pdf.save()

            db_loc = f"./chroma_dbs/bot_{bot.id}"
            shutil.rmtree(db_loc, ignore_errors=True)

            setup_vector_store(bot)
            messages.success(request, f"PDF for '{bot.name}' has been uploaded successfully!")
            return redirect('bot_list')
    else:
        form = PDFUploadForm()
    return render(request, 'bot_manager/upload_pdf.html', {'form': form, 'bot': bot})
