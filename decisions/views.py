from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Decision, Option, Criterion, Evaluation
from .serializers import (
    DecisionSerializer,
    OptionSerializer,
    CriterionSerializer,
    EvaluationSerializer,
)


def calculate_score(option):
    evaluations = option.evaluations.select_related("criterion")

    total_score = 0

    for evaluation in evaluations:
        total_score += (
            evaluation.score * evaluation.criterion.weight / 100
        )

    return round(total_score, 2)


class DecisionViewSet(viewsets.ModelViewSet):
    queryset = Decision.objects.all().order_by("-created_at")
    serializer_class = DecisionSerializer

    @action(detail=True, methods=["get"])
    def scores(self, request, pk=None):
        decision = self.get_object()

        results = []

        for option in decision.options.all():
            results.append({
                "option": option.name,
                "score": calculate_score(option)
            })

        return Response(results)


class OptionViewSet(viewsets.ModelViewSet):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer


class CriterionViewSet(viewsets.ModelViewSet):
    queryset = Criterion.objects.all()
    serializer_class = CriterionSerializer


class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer