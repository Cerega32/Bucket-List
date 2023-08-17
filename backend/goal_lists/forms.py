# goals/forms.py

from django import forms
from .models import Goal, GoalList

class GoalForm(forms.ModelForm):
    class Meta:
        model = Goal
        fields = ['title', 'category', 'description']

class GoalInListForm(forms.ModelForm):
    class Meta:
        model = GoalList
        fields = ['title', 'category', 'description']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ограничьте выбор целей только тех, которые соответствуют выбранной категории GoalList
        if 'instance' in kwargs:
            instance = kwargs['instance']
            self.fields['goals'] = forms.ModelMultipleChoiceField(
                queryset=Goal.objects.filter(category=instance.category),
                widget=forms.CheckboxSelectMultiple,
                required=False
            )
