import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api";

function App() {
  const [decisions, setDecisions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [options, setOptions] = useState([""]);
  const [criteria, setCriteria] = useState([
    { name: "", weight: "" },
  ]);

  const [scores, setScores] = useState({});
  const [savingScores, setSavingScores] = useState(false);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [editingDecisionId, setEditingDecisionId] = useState(null);

  const [savingDecision, setSavingDecision] = useState(false);

  const [deletingDecisionId, setDeletingDecisionId] = useState(null);

  const [notification, setNotification] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const showNotification = (type, title, message) => {
    setNotification({
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  useEffect(() => {
    fetch(`${API_URL}/decisions/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch decisions.");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Backend data:", data);
        setDecisions(data);
      })
      .catch((error) => {
        console.error("Backend connection error:", error);

        showNotification(
          "error",
          "Connection error",
          "Could not connect to the backend."
        );
      });
  }, []);

  useEffect(() => {
    if (!selectedDecision) {
      return;
    }

    const loadSavedScores = async () => {
      try {
        const response = await fetch(
          `${API_URL}/evaluations/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch saved evaluations.");
        }

        const evaluations = await response.json();

        const selectedOptionIds =
          selectedDecision.options?.map(
            (option) => option.id
          ) || [];

        const selectedCriterionIds =
          selectedDecision.criteria?.map(
            (criterion) => criterion.id
          ) || [];

        const decisionEvaluations = evaluations.filter(
          (evaluation) =>
            selectedOptionIds.includes(evaluation.option) &&
            selectedCriterionIds.includes(evaluation.criterion)
        );

        const loadedScores = {};

        decisionEvaluations.forEach((evaluation) => {
          const key = `${evaluation.option}-${evaluation.criterion}`;

          loadedScores[key] = evaluation.score;
        });

        setScores(loadedScores);
      } catch (error) {
        console.error(
          "Load saved scores error:",
          error
        );
      }
    };

    loadSavedScores();
  }, [selectedDecision]);

  const addOption = () => {
    setOptions((current) => [...current, ""]);
  };

  const removeOption = (index) => {
    setOptions((current) =>
      current.filter(
        (_, optionIndex) => optionIndex !== index
      )
    );
  };

  const updateOption = (index, value) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  const addCriterion = () => {
    setCriteria((current) => [
      ...current,
      { name: "", weight: "" },
    ]);
  };

  const removeCriterion = (index) => {
    setCriteria((current) =>
      current.filter(
        (_, criterionIndex) =>
          criterionIndex !== index
      )
    );
  };

  const updateCriterion = (index, field, value) => {
    setCriteria((current) =>
      current.map((criterion, criterionIndex) =>
        criterionIndex === index
          ? {
              ...criterion,
              [field]: value,
            }
          : criterion
      )
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOptions([""]);
    setCriteria([
      {
        name: "",
        weight: "",
      },
    ]);
    setEditingDecisionId(null);
  };

  const createDecision = async (event) => {
    event.preventDefault();

    const validOptions = options.filter(
      (option) => option.trim() !== ""
    );

    const validCriteria = criteria.filter(
      (criterion) =>
        criterion.name.trim() !== ""
    );

    if (validOptions.length === 0) {
      showNotification(
        "error",
        "Missing information",
        "Please add at least one option."
      );
      return;
    }

    if (validCriteria.length === 0) {
      showNotification(
        "error",
        "Missing information",
        "Please add at least one criterion."
      );
      return;
    }

    const totalWeight = validCriteria.reduce(
      (total, criterion) =>
        total + Number(criterion.weight || 0),
      0
    );

    if (totalWeight !== 100) {
      showNotification(
        "error",
        "Invalid weights",
        `Criterion weights must add up to 100%. Current total: ${totalWeight}%`
      );
      return;
    }

    setSavingDecision(true);

    try {
      const decisionResponse = await fetch(
        `${API_URL}/decisions/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title,
            description: description,
            status: "pending",
          }),
        }
      );

      if (!decisionResponse.ok) {
        throw new Error("Failed to create decision.");
      }

      const newDecision =
        await decisionResponse.json();

      for (const optionName of validOptions) {
        const optionResponse = await fetch(
          `${API_URL}/options/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              decision: newDecision.id,
              name: optionName,
            }),
          }
        );

        if (!optionResponse.ok) {
          throw new Error("Failed to create option.");
        }
      }

      for (const criterion of validCriteria) {
        const criterionResponse = await fetch(
          `${API_URL}/criteria/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              decision: newDecision.id,
              name: criterion.name,
              weight: Number(criterion.weight),
            }),
          }
        );

        if (!criterionResponse.ok) {
          throw new Error("Failed to create criterion.");
        }
      }

      const refreshedResponse = await fetch(
        `${API_URL}/decisions/${newDecision.id}/`
      );

      if (!refreshedResponse.ok) {
        throw new Error("Failed to refresh decision.");
      }

      const refreshedDecision =
        await refreshedResponse.json();

      setDecisions((current) => [
        refreshedDecision,
        ...current,
      ]);

      resetForm();
      setShowForm(false);

      showNotification(
        "success",
        "Decision created",
        "Your decision has been created successfully."
      );
    } catch (error) {
      console.error(
        "Create decision error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The decision could not be created. Please try again."
      );
    } finally {
      setSavingDecision(false);
    }
  };

  const openEditDecision = (decision) => {
    setEditingDecisionId(decision.id);

    setTitle(decision.title);
    setDescription(decision.description || "");

    setOptions(
      decision.options?.length > 0
        ? decision.options.map((option) => ({
            id: option.id,
            name: option.name,
          }))
        : [""]
    );

    setCriteria(
      decision.criteria?.length > 0
        ? decision.criteria.map((criterion) => ({
            id: criterion.id,
            name: criterion.name,
            weight: criterion.weight,
          }))
        : [
            {
              name: "",
              weight: "",
            },
          ]
    );

    setSelectedDecision(null);
    setResults([]);
    setScores({});
    setShowDecisions(false);
    setShowForm(true);
  };

  const updateDecision = async (event) => {
    event.preventDefault();

    const validOptions = options.filter(
      (option) =>
        typeof option === "string"
          ? option.trim() !== ""
          : option.name.trim() !== ""
    );

    const validCriteria = criteria.filter(
      (criterion) =>
        criterion.name.trim() !== ""
    );

    if (validOptions.length === 0) {
      showNotification(
        "error",
        "Missing information",
        "Please add at least one option."
      );
      return;
    }

    if (validCriteria.length === 0) {
      showNotification(
        "error",
        "Missing information",
        "Please add at least one criterion."
      );
      return;
    }

    const totalWeight = validCriteria.reduce(
      (total, criterion) =>
        total + Number(criterion.weight || 0),
      0
    );

    if (totalWeight !== 100) {
      showNotification(
        "error",
        "Invalid weights",
        `Criterion weights must add up to 100%. Current total: ${totalWeight}%`
      );
      return;
    }

    setSavingDecision(true);

    try {
      const decisionResponse = await fetch(
        `${API_URL}/decisions/${editingDecisionId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title,
            description: description,
          }),
        }
      );

      if (!decisionResponse.ok) {
        throw new Error("Failed to update decision.");
      }

      const currentDecisionResponse =
        await fetch(
          `${API_URL}/decisions/${editingDecisionId}/`
        );

      if (!currentDecisionResponse.ok) {
        throw new Error("Failed to fetch current decision.");
      }

      const currentDecision =
        await currentDecisionResponse.json();

      const currentOptions =
        currentDecision.options || [];

      const currentCriteria =
        currentDecision.criteria || [];

      const updatedOptionIds = [];

      for (const option of validOptions) {
        const optionName =
          typeof option === "string"
            ? option
            : option.name;

        const optionId =
          typeof option === "string"
            ? null
            : option.id;

        if (optionId) {
          const response = await fetch(
            `${API_URL}/options/${optionId}/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: optionName,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to update option.");
          }

          updatedOptionIds.push(optionId);
        } else {
          const response = await fetch(
            `${API_URL}/options/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                decision: editingDecisionId,
                name: optionName,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to create option.");
          }
        }
      }

      for (const currentOption of currentOptions) {
        if (!updatedOptionIds.includes(currentOption.id)) {
          const evaluationsResponse =
            await fetch(
              `${API_URL}/evaluations/`
            );

          if (!evaluationsResponse.ok) {
            throw new Error("Failed to fetch evaluations.");
          }

          const evaluations =
            await evaluationsResponse.json();

          const optionEvaluations =
            evaluations.filter(
              (evaluation) =>
                evaluation.option === currentOption.id
            );

          for (const evaluation of optionEvaluations) {
            const deleteEvaluationResponse =
              await fetch(
                `${API_URL}/evaluations/${evaluation.id}/`,
                {
                  method: "DELETE",
                }
              );

            if (!deleteEvaluationResponse.ok) {
              throw new Error(
                "Failed to delete option evaluations."
              );
            }
          }

          const deleteResponse = await fetch(
            `${API_URL}/options/${currentOption.id}/`,
            {
              method: "DELETE",
            }
          );

          if (!deleteResponse.ok) {
            throw new Error("Failed to delete option.");
          }
        }
      }

      const updatedCriterionIds = [];

      for (const criterion of validCriteria) {
        if (criterion.id) {
          const response = await fetch(
            `${API_URL}/criteria/${criterion.id}/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: criterion.name,
                weight: Number(criterion.weight),
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to update criterion.");
          }

          updatedCriterionIds.push(criterion.id);
        } else {
          const response = await fetch(
            `${API_URL}/criteria/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                decision: editingDecisionId,
                name: criterion.name,
                weight: Number(criterion.weight),
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to create criterion.");
          }
        }
      }

      for (const currentCriterion of currentCriteria) {
        if (
          !updatedCriterionIds.includes(
            currentCriterion.id
          )
        ) {
          const evaluationsResponse =
            await fetch(
              `${API_URL}/evaluations/`
            );

          if (!evaluationsResponse.ok) {
            throw new Error("Failed to fetch evaluations.");
          }

          const evaluations =
            await evaluationsResponse.json();

          const criterionEvaluations =
            evaluations.filter(
              (evaluation) =>
                evaluation.criterion ===
                currentCriterion.id
            );

          for (const evaluation of criterionEvaluations) {
            const deleteEvaluationResponse =
              await fetch(
                `${API_URL}/evaluations/${evaluation.id}/`,
                {
                  method: "DELETE",
                }
              );

            if (!deleteEvaluationResponse.ok) {
              throw new Error(
                "Failed to delete criterion evaluations."
              );
            }
          }

          const deleteResponse = await fetch(
            `${API_URL}/criteria/${currentCriterion.id}/`,
            {
              method: "DELETE",
            }
          );

          if (!deleteResponse.ok) {
            throw new Error("Failed to delete criterion.");
          }
        }
      }

      const refreshedResponse = await fetch(
        `${API_URL}/decisions/${editingDecisionId}/`
      );

      if (!refreshedResponse.ok) {
        throw new Error("Failed to refresh decision.");
      }

      const refreshedDecision =
        await refreshedResponse.json();

      setDecisions((current) =>
        current.map((decision) =>
          decision.id === refreshedDecision.id
            ? refreshedDecision
            : decision
        )
      );

      resetForm();
      setShowForm(false);

      showNotification(
        "success",
        "Decision updated",
        "Your changes have been saved successfully."
      );
    } catch (error) {
      console.error(
        "Update decision error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The changes could not be saved. Please try again."
      );
    } finally {
      setSavingDecision(false);
    }
  };

  const deleteDecision = (decisionId) => {
    setConfirmDeleteId(decisionId);
  };

  const confirmDeleteDecision = async () => {
    const decisionId = confirmDeleteId;

    setConfirmDeleteId(null);

    if (!decisionId) {
      return;
    }

    setDeletingDecisionId(decisionId);

    try {
      const evaluationsResponse =
        await fetch(
          `${API_URL}/evaluations/`
        );

      if (!evaluationsResponse.ok) {
        throw new Error("Failed to fetch evaluations.");
      }

      const evaluations =
        await evaluationsResponse.json();

      const decision = decisions.find(
        (item) => item.id === decisionId
      );

      const optionIds =
        decision?.options?.map(
          (option) => option.id
        ) || [];

      const criterionIds =
        decision?.criteria?.map(
          (criterion) => criterion.id
        ) || [];

      const relatedEvaluations =
        evaluations.filter(
          (evaluation) =>
            optionIds.includes(evaluation.option) ||
            criterionIds.includes(evaluation.criterion)
        );

      for (const evaluation of relatedEvaluations) {
        const response = await fetch(
          `${API_URL}/evaluations/${evaluation.id}/`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete evaluation.");
        }
      }

      const optionsToDelete =
        decision?.options || [];

      for (const option of optionsToDelete) {
        const response = await fetch(
          `${API_URL}/options/${option.id}/`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete option.");
        }
      }

      const criteriaToDelete =
        decision?.criteria || [];

      for (const criterion of criteriaToDelete) {
        const response = await fetch(
          `${API_URL}/criteria/${criterion.id}/`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete criterion.");
        }
      }

      const decisionResponse = await fetch(
        `${API_URL}/decisions/${decisionId}/`,
        {
          method: "DELETE",
        }
      );

      if (!decisionResponse.ok) {
        throw new Error("Failed to delete decision.");
      }

      setDecisions((current) =>
        current.filter(
          (decision) =>
            decision.id !== decisionId
        )
      );

      if (
        selectedDecision &&
        selectedDecision.id === decisionId
      ) {
        setSelectedDecision(null);
        setResults([]);
        setScores({});
      }

      showNotification(
        "success",
        "Decision deleted",
        "The decision has been deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete decision error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The decision could not be deleted. Please try again."
      );
    } finally {
      setDeletingDecisionId(null);
    }
  };

  const updateScore = (
    optionId,
    criterionId,
    value
  ) => {
    const key = `${optionId}-${criterionId}`;

    setScores((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveScores = async () => {
    if (!selectedDecision) {
      return;
    }

    const selectedOptions =
      selectedDecision.options || [];

    const selectedCriteria =
      selectedDecision.criteria || [];

    if (
      selectedOptions.length === 0 ||
      selectedCriteria.length === 0
    ) {
      showNotification(
        "error",
        "Missing information",
        "You need at least one option and one criterion."
      );
      return;
    }

    for (const option of selectedOptions) {
      for (const criterion of selectedCriteria) {
        const key = `${option.id}-${criterion.id}`;
        const value = scores[key];

        if (
          value === undefined ||
          value === "" ||
          Number(value) < 1 ||
          Number(value) > 10
        ) {
          showNotification(
            "error",
            "Invalid score",
            `Please enter a score between 1 and 10 for ${option.name} - ${criterion.name}.`
          );
          return;
        }
      }
    }

    setSavingScores(true);

    try {
      const evaluationsResponse =
        await fetch(
          `${API_URL}/evaluations/`
        );

      if (!evaluationsResponse.ok) {
        throw new Error("Failed to fetch evaluations.");
      }

      const evaluations =
        await evaluationsResponse.json();

      const selectedOptionIds =
        selectedOptions.map(
          (option) => option.id
        );

      const selectedCriterionIds =
        selectedCriteria.map(
          (criterion) => criterion.id
        );

      const existingEvaluations =
        evaluations.filter(
          (evaluation) =>
            selectedOptionIds.includes(
              evaluation.option
            ) &&
            selectedCriterionIds.includes(
              evaluation.criterion
            )
        );

      for (const evaluation of existingEvaluations) {
        const deleteResponse = await fetch(
          `${API_URL}/evaluations/${evaluation.id}/`,
          {
            method: "DELETE",
          }
        );

        if (!deleteResponse.ok) {
          throw new Error(
            "Failed to update existing scores."
          );
        }
      }

      for (const option of selectedOptions) {
        for (const criterion of selectedCriteria) {
          const key = `${option.id}-${criterion.id}`;

          const evaluationResponse =
            await fetch(
              `${API_URL}/evaluations/`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  option: option.id,
                  criterion: criterion.id,
                  score: Number(scores[key]),
                }),
              }
            );

          if (!evaluationResponse.ok) {
            throw new Error("Failed to save score.");
          }
        }
      }

      showNotification(
        "success",
        "Scores saved",
        "Your evaluation scores have been saved successfully."
      );
    } catch (error) {
      console.error(
        "Save scores error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The scores could not be saved. Please try again."
      );
    } finally {
      setSavingScores(false);
    }
  };

  const calculateResults = async () => {
    if (!selectedDecision) {
      return;
    }

    setLoadingResults(true);

    try {
      const response = await fetch(
        `${API_URL}/decisions/${selectedDecision.id}/scores/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results.");
      }

      const data = await response.json();

      const sortedResults = [...data].sort(
        (a, b) => b.score - a.score
      );

      setResults(sortedResults);
    } catch (error) {
      console.error(
        "Calculate results error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The results could not be calculated. Please try again."
      );
    } finally {
      setLoadingResults(false);
    }
  };

  const markAsCompleted = async () => {
    if (!selectedDecision) {
      return;
    }

    setUpdatingStatus(true);

    try {
      const response = await fetch(
        `${API_URL}/decisions/${selectedDecision.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update decision status."
        );
      }

      const updatedDecision =
        await response.json();

      setSelectedDecision(updatedDecision);

      setDecisions((current) =>
        current.map((decision) =>
          decision.id === updatedDecision.id
            ? updatedDecision
            : decision
        )
      );

      showNotification(
        "success",
        "Decision completed",
        "The decision has been marked as completed."
      );
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong",
        "The decision status could not be updated. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const notificationElement =
    notification && (
      <div
        style={{
          position: "fixed",
          top: "28px",
          right: "28px",
          zIndex: 99999,
          width: "min(380px, calc(100vw - 40px))",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: "13px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            flexShrink: 0,
            borderRadius: "50%",
            background: "#e8eef5",
            color: "#4b6584",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            fontWeight: "700",
          }}
        >
          {notification.type === "success"
            ? "✓"
            : "!"}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              color: "#172033",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            {notification.title}
          </p>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {notification.message}
          </p>
        </div>

        <button
          onClick={() => setNotification(null)}
          aria-label="Close notification"
          style={{
            width: "26px",
            height: "26px",
            flexShrink: 0,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: "1",
          }}
        >
          ×
        </button>
      </div>
    );

  /*
    DELETE CONFIRMATION MESSAGE BOX

    Burada artık browser confirm() kullanılmıyor.
    React kendi mesaj kutusunu gösteriyor.
  */
  const deleteConfirmationElement =
    confirmDeleteId !== null && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
          background: "rgba(17, 24, 39, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "min(430px, 100%)",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#f3f4f6",
              color: "#172033",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "18px",
            }}
          >
            !
          </div>

          <h3
            style={{
              margin: "0 0 10px",
              color: "#172033",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            Delete Decision?
          </h3>

          <p
            style={{
              margin: "0",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            This decision will be permanently
            deleted. This action cannot be undone.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "26px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setConfirmDeleteId(null)
              }
              style={{
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#374151",
                padding: "11px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDeleteDecision}
              style={{
                border: "none",
                background: "#111827",
                color: "#ffffff",
                padding: "11px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );

  if (selectedDecision) {
    return (
      <div className="app">
        {notificationElement}
        {deleteConfirmationElement}

        <aside className="sidebar">
          <div className="logo">
            DecisionFlow
          </div>

          <nav>
            <button
              className="nav-item"
              onClick={() => {
                setSelectedDecision(null);
                setShowDecisions(false);
                setResults([]);
                setScores({});
              }}
            >
              Dashboard
            </button>

            <button
              className="nav-item active"
              onClick={() => {
                setSelectedDecision(null);
                setShowDecisions(true);
                setResults([]);
                setScores({});
              }}
            >
              Decisions
            </button>
          </nav>
        </aside>

        <main className="main">
          <button
            className="back-button"
            onClick={() => {
              setSelectedDecision(null);
              setResults([]);
              setScores({});
            }}
          >
            ← Back to Decisions
          </button>

          <header className="header">
            <div>
              <h1>
                {selectedDecision.title}
              </h1>

              <p>
                {selectedDecision.description ||
                  "Structure your evaluation and compare your options with clear, weighted criteria."}
              </p>
            </div>

            <div className="detail-header-actions">
              <span className="status">
                {selectedDecision.status ===
                "completed"
                  ? "Completed"
                  : "Pending"}
              </span>

              {selectedDecision.status !==
                "completed" && (
                <button
                  className="complete-button"
                  onClick={markAsCompleted}
                  disabled={updatingStatus}
                >
                  {updatingStatus
                    ? "Updating..."
                    : "✓ Mark as Completed"}
                </button>
              )}

              <button
                className="new-button"
                onClick={() =>
                  openEditDecision(
                    selectedDecision
                  )
                }
              >
                ✏ Edit
              </button>

              <button
                className="remove-button"
                onClick={() =>
                  deleteDecision(
                    selectedDecision.id
                  )
                }
                disabled={
                  deletingDecisionId ===
                  selectedDecision.id
                }
              >
                {deletingDecisionId ===
                selectedDecision.id
                  ? "..."
                  : "×"}
              </button>
            </div>
          </header>

          <section className="stats">
            <div className="stat-card">
              <span>Options to Compare</span>

              <strong>
                {selectedDecision.options
                  ?.length || 0}
              </strong>
            </div>

            <div className="stat-card">
              <span>Evaluation Criteria</span>

              <strong>
                {selectedDecision.criteria
                  ?.length || 0}
              </strong>
            </div>
          </section>

          <section className="decisions-section">
            <div className="section-header">
              <h2>Decision Setup</h2>

              <span>
                {selectedDecision.status ===
                "completed"
                  ? "Evaluation completed"
                  : "Ready for evaluation"}
              </span>
            </div>

            <div className="detail-card">
              <h3>Options</h3>

              {selectedDecision.options
                ?.length > 0 ? (
                <div className="option-list">
                  {selectedDecision.options.map(
                    (option) => (
                      <div
                        className="option-item"
                        key={option.id}
                      >
                        {option.name}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No options have been added yet.
                </p>
              )}
            </div>

            <div className="detail-card">
              <h3>Evaluation Criteria</h3>

              {selectedDecision.criteria
                ?.length > 0 ? (
                <div className="criteria-list">
                  {selectedDecision.criteria.map(
                    (criterion) => (
                      <div
                        className="criterion-item"
                        key={criterion.id}
                      >
                        <span>
                          {criterion.name}
                        </span>

                        <strong>
                          {criterion.weight}%
                        </strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No evaluation criteria have
                  been added yet.
                </p>
              )}
            </div>

            <div className="detail-card score-card">
              <div className="score-header">
                <div>
                  <h3>
                    Evaluate Your Options
                  </h3>

                  <p>
                    Score each option from 1 to
                    10 based on every criterion.
                    The weighted results will be
                    calculated from your inputs.
                  </p>
                </div>

                <div className="score-actions">
                  <button
                    className="save-scores-button"
                    onClick={saveScores}
                    disabled={savingScores}
                  >
                    {savingScores
                      ? "Saving..."
                      : "Save Scores"}
                  </button>

                  <button
                    className="calculate-button"
                    onClick={calculateResults}
                    disabled={loadingResults}
                  >
                    {loadingResults
                      ? "Calculating..."
                      : "Calculate Results"}
                  </button>
                </div>
              </div>

              {selectedDecision.options
                ?.length > 0 &&
              selectedDecision.criteria
                ?.length > 0 ? (
                <div className="score-table-wrapper">
                  <table className="score-table">
                    <thead>
                      <tr>
                        <th>Option</th>

                        {selectedDecision.criteria.map(
                          (criterion) => (
                            <th
                              key={criterion.id}
                            >
                              <div>
                                {criterion.name}
                              </div>

                              <span>
                                {criterion.weight}%
                              </span>
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {selectedDecision.options.map(
                        (option) => (
                          <tr key={option.id}>
                            <td className="score-option-name">
                              {option.name}
                            </td>

                            {selectedDecision.criteria.map(
                              (criterion) => {
                                const key = `${option.id}-${criterion.id}`;

                                return (
                                  <td
                                    key={
                                      criterion.id
                                    }
                                  >
                                    <input
                                      className="score-input"
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={
                                        scores[
                                          key
                                        ] ?? ""
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateScore(
                                          option.id,
                                          criterion.id,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder="1–10"
                                    />
                                  </td>
                                );
                              }
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>
                  Add options and evaluation
                  criteria before entering scores.
                </p>
              )}
            </div>

            {results.length > 0 && (
              <div className="detail-card results-card">
                <div className="results-header">
                  <div>
                    <h3>
                      Comparison Results
                    </h3>

                    <p>
                      Weighted scores based on
                      the criteria and importance
                      levels you defined.
                    </p>
                  </div>
                </div>

                <div className="results-list">
                  {results.map(
                    (result, index) => {
                      const numericScore =
                        Number(result.score);

                      const percentage =
                        Math.min(
                          Math.max(
                            (numericScore / 10) *
                              100,
                            0
                          ),
                          100
                        );

                      return (
                        <div
                          className="result-item"
                          key={result.option}
                        >
                          <div className="result-info">
                            <div className="result-name">
                              <span className="result-rank">
                                {index + 1}
                              </span>

                              <strong>
                                {result.option}
                              </strong>
                            </div>

                            <strong className="result-score">
                              {numericScore.toFixed(2)}

                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  marginLeft: "4px",
                                  color: "#6b7280",
                                }}
                              >
                                / 10
                              </span>
                            </strong>
                          </div>

                          <div className="result-bar-background">
                            <div
                              className="result-bar"
                              style={{
                                width: `${percentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop: "1px solid #e5e7eb",
                    color: "#6b7280",
                    fontSize: "12px",
                    lineHeight: "1.6",
                  }}
                >
                  Scores are calculated using
                  the criteria weights defined for
                  this decision. DecisionFlow
                  provides a structured comparison;
                  the final decision remains with
                  the user.
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {notificationElement}
      {deleteConfirmationElement}

      <aside className="sidebar">
        <div className="logo">
          DecisionFlow
        </div>

        <nav>
          <button
            className={
              !showDecisions
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setShowDecisions(false);
              setShowForm(false);
            }}
          >
            Dashboard
          </button>

          <button
            className={
              showDecisions
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setShowDecisions(true);
              setShowForm(false);
            }}
          >
            Decisions
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>
              {showDecisions
                ? "Decisions"
                : "Dashboard"}
            </h1>

            <p>
              {showDecisions
                ? "Review, manage, and evaluate your decision scenarios."
                : "Structure your options, define what matters, and compare your choices with a clear, weighted approach."}
            </p>
          </div>

          <button
            className="new-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + New Decision
          </button>
        </header>

        {showForm && (
          <section className="form-card">
            <h2>
              {editingDecisionId
                ? "Edit Decision"
                : "Create a New Decision"}
            </h2>

            <form
              onSubmit={
                editingDecisionId
                  ? updateDecision
                  : createDecision
              }
            >
              <label>Decision Title</label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Select a Software Supplier"
                required
              />

              <label>Decision Context</label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Briefly describe the decision you are evaluating..."
              />

              <label>Options to Compare</label>

              <div className="dynamic-list">
                {options.map((option, index) => {
                  const optionValue =
                    typeof option === "string"
                      ? option
                      : option.name;

                  return (
                    <div
                      className="dynamic-row"
                      key={
                        typeof option === "string"
                          ? index
                          : option.id || index
                      }
                    >
                      <input
                        type="text"
                        value={optionValue}
                        onChange={(event) =>
                          updateOption(
                            index,
                            event.target.value
                          )
                        }
                        placeholder={`Option ${index + 1}`}
                      />

                      {options.length > 1 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() =>
                            removeOption(index)
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="add-button"
                onClick={addOption}
              >
                + Add Another Option
              </button>

              <label className="criteria-label">
                Evaluation Criteria
              </label>

              <div className="dynamic-list">
                {criteria.map(
                  (criterion, index) => (
                    <div
                      className="dynamic-row criterion-row"
                      key={criterion.id || index}
                    >
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Price, Risk, Delivery Time"
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={criterion.weight}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "weight",
                            event.target.value
                          )
                        }
                        placeholder="%"
                      />

                      {criteria.length > 1 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() =>
                            removeCriterion(index)
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                className="add-button"
                onClick={addCriterion}
              >
                + Add Another Criterion
              </button>

              <div className="weight-total">
                Total Importance:{" "}
                <strong>
                  {criteria.reduce(
                    (total, criterion) =>
                      total +
                      Number(
                        criterion.weight || 0
                      ),
                    0
                  )}
                  %
                </strong>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-button"
                  disabled={savingDecision}
                >
                  {savingDecision
                    ? "Saving..."
                    : editingDecisionId
                    ? "Save Changes"
                    : "Create Decision"}
                </button>
              </div>
            </form>
          </section>
        )}

        {!showForm && (
          <>
            {!showDecisions && (
              <section className="stats">
                <div className="stat-card">
                  <span>Total Decisions</span>

                  <strong>
                    {decisions.length}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>Pending</span>

                  <strong>
                    {
                      decisions.filter(
                        (decision) =>
                          decision.status ===
                          "pending"
                      ).length
                    }
                  </strong>
                </div>

                <div className="stat-card">
                  <span>Completed</span>

                  <strong>
                    {
                      decisions.filter(
                        (decision) =>
                          decision.status ===
                          "completed"
                      ).length
                    }
                  </strong>
                </div>
              </section>
            )}

            <section className="decisions-section">
              <div className="section-header">
                <h2>
                  {showDecisions
                    ? "All Decisions"
                    : "Recent Decisions"}
                </h2>

                <span>
                  {decisions.length}{" "}
                  {decisions.length === 1
                    ? "decision"
                    : "decisions"}
                </span>
              </div>

              {decisions.length === 0 ? (
                <div className="empty-state">
                  <h3>No decisions yet</h3>

                  <p>
                    Create your first decision
                    to organize your options and
                    compare them using weighted
                    criteria.
                  </p>
                </div>
              ) : (
                <div className="decision-grid">
                  {decisions.map((decision) => (
                    <div
                      className="decision-card"
                      key={decision.id}
                      onClick={() =>
                        setSelectedDecision(
                          decision
                        )
                      }
                    >
                      <div className="card-top">
                        <span className="status">
                          {decision.status ===
                          "completed"
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </div>

                      <h3>{decision.title}</h3>

                      <p>
                        {decision.description ||
                          "A structured decision scenario ready for evaluation."}
                      </p>

                      <div className="card-footer">
                        <span>
                          {decision.options
                            ?.length || 0}{" "}
                          options
                        </span>

                        <span>
                          {decision.criteria
                            ?.length || 0}{" "}
                          criteria
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "15px",
                        }}
                      >
                        <button
                          className="new-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            openEditDecision(
                              decision
                            );
                          }}
                        >
                          ✏ Edit
                        </button>

                        <button
                          className="remove-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            deleteDecision(
                              decision.id
                            );
                          }}
                          disabled={
                            deletingDecisionId ===
                            decision.id
                          }
                        >
                          {deletingDecisionId ===
                          decision.id
                            ? "..."
                            : "×"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;