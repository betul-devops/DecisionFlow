from django.db import models


class Decision(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Option(models.Model):
    decision = models.ForeignKey(
        Decision,
        on_delete=models.CASCADE,
        related_name="options"
    )
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Criterion(models.Model):
    decision = models.ForeignKey(
        Decision,
        on_delete=models.CASCADE,
        related_name="criteria"
    )
    name = models.CharField(max_length=100)
    weight = models.FloatField()

    def __str__(self):
        return self.name


class Evaluation(models.Model):
    option = models.ForeignKey(
        Option,
        on_delete=models.CASCADE,
        related_name="evaluations"
    )
    criterion = models.ForeignKey(
        Criterion,
        on_delete=models.CASCADE,
        related_name="evaluations"
    )
    score = models.FloatField()

    def __str__(self):
        return f"{self.option} - {self.criterion}: {self.score}"