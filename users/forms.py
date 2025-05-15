from django.core.exceptions import ValidationError
from django.forms import EmailField, EmailInput, PasswordInput, CharField
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User


class CustomSignUpForm(UserCreationForm):
    email = EmailField(widget=EmailInput(attrs={'class': 'input', 'placeholder': 'Email'}))
    password1 = CharField(widget=PasswordInput(attrs={'class': 'input', 'placeholder': 'Password'}))
    password2 = CharField(widget=PasswordInput(attrs={'class': 'input', 'placeholder': 'Confirm Password'}))

    class Meta:
        model = User
        fields = ['email', 'password1', 'password2']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise ValidationError('A user with this email already exists.')
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data['email']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user



class CustomLogInForm(AuthenticationForm):
    username = EmailField(widget=EmailInput(attrs={'class':'input', 'placeholder':'Email'}))
    password = CharField(widget=PasswordInput(attrs={'class':'input', 'placeholder':'Password'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = "Email"