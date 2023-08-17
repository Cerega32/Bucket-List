# Generated by Django 4.2.4 on 2023-08-04 14:14

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("goals", "0002_initial"),
        ("goal_lists", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoalInList",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "goal",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="goals.goal"
                    ),
                ),
                (
                    "goal_list",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="goal_lists.goallist",
                    ),
                ),
            ],
            options={
                "unique_together": {("goal", "goal_list")},
            },
        ),
    ]
