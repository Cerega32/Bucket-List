# Generated by Django 4.2.3 on 2024-01-29 17:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('goals', '0012_alter_goal_added_from_list'),
        ('goal_lists', '0008_alter_goallist_category_alter_goallist_complexity'),
    ]

    operations = [
        migrations.AlterField(
            model_name='goallist',
            name='goals',
            field=models.ManyToManyField(to='goals.goal'),
        ),
    ]
