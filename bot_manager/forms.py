from django.forms import ModelForm

from bot_manager.models import PDFDocument


class PDFUploadForm(ModelForm):
    class Meta:
        model = PDFDocument
        fields = ['file']