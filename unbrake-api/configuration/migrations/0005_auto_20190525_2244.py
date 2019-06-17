# Generated by Django 2.2 on 2019-05-25 22:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuration', '0004_auto_20190525_1252'),
    ]

    operations = [
        migrations.AddField(
            model_name='config',
            name='is_default',
            field=models.BooleanField(default=False),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='config',
            name='name',
            field=models.CharField(default=False, max_length=15),
            preserve_default=False,
        ),
    ]