# Generated by Django 4.2.4 on 2023-08-04 08:38

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('goal_lists', '0001_initial'),
        ('goals', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='goallist',
            name='added_by_users',
            field=models.ManyToManyField(related_name='added_goal_lists', to='users.customuser'),
        ),
        migrations.AddField(
            model_name='goallist',
            name='completed_by_users',
            field=models.ManyToManyField(related_name='completed_goal_lists', to='users.customuser'),
        ),
        migrations.AddField(
            model_name='goallist',
            name='goals',
            field=models.ManyToManyField(related_name='goal_lists', to='goals.goal'),
        ),
    ]
