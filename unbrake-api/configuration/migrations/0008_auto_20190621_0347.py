# Generated by Django 2.2.2 on 2019-06-21 03:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuration', '0007_merge_20190616_0207'),
    ]

    operations = [
        migrations.AlterField(
            model_name='config',
            name='name',
            field=models.CharField(blank=True, max_length=15),
        ),
    ]