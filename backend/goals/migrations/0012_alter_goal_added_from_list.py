# Generated by Django 4.2.3 on 2024-01-11 17:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('goals', '0011_remove_goal_added_from_list_goal_added_from_list'),
    ]

    operations = [
        migrations.AlterField(
            model_name='goal',
            name='added_from_list',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
