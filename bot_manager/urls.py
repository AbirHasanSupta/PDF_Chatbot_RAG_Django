from django.urls import path
from . import views

urlpatterns = [
    path('', views.bot_list, name='bot_list'),
    path('create/', views.create_bot, name='create_bot'),
    path('<int:bot_id>/delete/', views.delete_bot, name='delete_bot'),
    path('<int:bot_id>/upload_pdf', views.upload_pdf, name='upload_pdf')
]