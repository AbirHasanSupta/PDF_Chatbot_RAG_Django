from django.contrib import admin
from .models import Bot

@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'user', 'created_at']
    list_filter = ['name', 'user']
    search_fields = ['name', 'description']
    sortable_by = ['created_at']

