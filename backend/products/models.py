from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=150)
    reference = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)
    alert_threshold = models.PositiveIntegerField(default=5)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.name} ({self.reference})"