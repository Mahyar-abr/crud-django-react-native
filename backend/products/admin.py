from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "reference",
        "category",
        "quantity",
        "alert_threshold",
    )
    search_fields = ("name", "reference")
    list_filter = ("category",)