# Generated by Django 2.2.2 on 2019-06-21 02:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calibration', '0004_merge_20190615_2234'),
    ]

    operations = [
        migrations.AlterField(
            model_name='calibration',
            name='name',
            field=models.CharField(blank=True, max_length=15),
        ),
    ]