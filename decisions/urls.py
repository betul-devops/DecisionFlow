from rest_framework.routers import DefaultRouter
from .views import (
    DecisionViewSet,
    OptionViewSet,
    CriterionViewSet,
    EvaluationViewSet,
)

router = DefaultRouter()

router.register("decisions", DecisionViewSet)
router.register("options", OptionViewSet)
router.register("criteria", CriterionViewSet)
router.register("evaluations", EvaluationViewSet)

urlpatterns = router.urls