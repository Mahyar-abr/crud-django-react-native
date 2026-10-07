from django.db.models import F, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Product
from .serializers import ProductSerializer, StockMovementSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Product.objects.all().order_by("name", "id")

        search = self.request.query_params.get("search", "").strip()
        category = self.request.query_params.get("category", "").strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(reference__icontains=search)
            )

        if category:
            queryset = queryset.filter(category__iexact=category)

        return queryset

    @action(detail=True, methods=["post"])
    def movements(self, request, pk=None):
        product = self.get_object()

        serializer = StockMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data["quantity"]
        movement_type = serializer.validated_data["type"]

        queryset = Product.objects.filter(pk=product.pk)

        if movement_type == "out":
            queryset = queryset.filter(quantity__gte=quantity)
            change = -quantity
        else:
            change = quantity

        updated = queryset.update(
            quantity=F("quantity") + change,
            updated_at=timezone.now(),
        )

        if updated == 0:
            raise ValidationError({
                "quantity": "Stock insuffisant pour cette sortie."
            })

        product.refresh_from_db()
        return Response(self.get_serializer(product).data)