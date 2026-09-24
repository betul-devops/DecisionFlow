from rest_framework import serializers
from .models import Decision, Option, Criterion, Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = "__all__"


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = "__all__"


class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = "__all__"


class DecisionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    criteria = CriterionSerializer(many=True, read_only=True)

    class Meta:
        model = Decision
        fields = [
            "id",
            "title",
            "description",
            "status",
            "created_at",
            "options",
            "criteria",
        ]