from django.contrib import admin
from .models import ChatSession


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'created_at', 'bot']
    list_filter = ['user', 'bot', 'title']
    search_fields = ['title']
    sortable_by = ['created_at']