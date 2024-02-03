# Generated by Django 4.2.3 on 2024-01-11 17:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('goals', '0010_goal_created_at_remove_goal_added_from_list_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='goal',
            name='added_from_list',
        ),
        migrations.AddField(
            model_name='goal',
            name='added_from_list',
            field=models.JSONField(default=dict),
        ),
    ]
