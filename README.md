# 🧭 DecisionFlow

A full-stack decision-making web application built with **Django REST Framework** and **React (Vite)**, containerized with **Docker Compose**.

## 🚀 Features

- Dynamic weighted decision matrix (enforces strict 100% total weight validation).
- Real-time decision metrics dashboard (Total, Pending, Completed).
- Decoupled RESTful API architecture.
- Multi-container orchestration via Docker Compose.

## 🛠 Tech Stack

- **Backend:** Python, Django, Django REST Framework, SQLite
- **Frontend:** React, Vite
- **DevOps:** Docker, Docker Compose

## 🐳 Quick Start (Docker)

Ensure Docker Desktop is running, then run:

# 1. Clone the repository
git clone [https://github.com/betul-devops/DecisionFlow.git](https://github.com/betul-devops/DecisionFlow.git)
cd DecisionFlow

# 2. Build and start containers
docker compose up --build
