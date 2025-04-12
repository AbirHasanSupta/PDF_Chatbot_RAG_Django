from django.contrib.auth.models import User
from django.db import models


class Bot(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bots')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class PDFDocument(models.Model):
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE, related_name='pdfs')
    file = models.FileField(upload_to='pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name