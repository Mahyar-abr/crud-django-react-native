from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=0, default=0)
    alert_threshold = serializers.IntegerField(min_value=0, default=5)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "reference",
            "description",
            "category",
            "quantity",
            "alert_threshold",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

class StockMovementSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["in", "out"])
    quantity = serializers.IntegerField(min_value=1)