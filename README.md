# Employee Management System

A dynamic Employee Management System built with Django and Vanilla JS.

## Tech Stack
- **Backend:** Django, Django REST Framework, SimpleJWT
- **Frontend:** HTML5, Vanilla JavaScript, CSS, Axios
- **Database:** SQLite (default)

## Features
- **Authentication:** JWT-based login, registration, and profile management.
- **Dynamic Form Designer:** Create custom employee templates with drag-and-drop field ordering.
- **Dynamic Employee CRUD:** Add employees based on custom form templates.
- **Advanced Employee Filtering:** Search globally or filter by specific dynamic field labels and values.

## Setup Instructions

1. **Clone & Enter Project**
   ```bash
   git clone <your-repo-url>
   cd emp_mng
   ```

2. **Create and Activate Virtual Environment**
   ```bash
   python -m venv venv

   # Windows
   .\venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create Superuser (for Admin Panel)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

## Access the Application
- Web App: `http://127.0.0.1:8000/`
- Admin Panel: `http://127.0.0.1:8000/admin`

## Getting Started
Register a new account at `http://127.0.0.1:8000/register/` or via the Postman `Register` endpoint, then login to get your JWT token.

## API Summary

- `POST /api/auth/register/` — Register new user (returns JWT)
- `POST /api/auth/login/` — Login (returns access + refresh JWT)
- `POST /api/auth/token/refresh/` — Refresh access token
- `GET /api/auth/profile/` — Get user profile
- `PUT /api/auth/profile/` — Update profile
- `PUT /api/auth/change-password/` — Change password

- `GET /api/forms/` — List form templates
- `POST /api/forms/` — Create form template (with nested fields)
- `GET /api/forms/<id>/` — Get specific form
- `PUT /api/forms/<id>/` — Update form template
- `DELETE /api/forms/<id>/` — Delete form

- `GET /api/employees/` — List employees (supports `?search=`, `?field=&value=`)
- `POST /api/employees/` — Create employee (with nested dynamic field values)
- `GET /api/employees/<id>/` — Get specific employee
- `PUT /api/employees/<id>/` — Update employee
- `DELETE /api/employees/<id>/` — Delete employee

## Postman Collection
Import `postman_collection.json` into Postman.
All endpoints require JWT Bearer token except Login and Register.
The Login endpoint includes a test script that auto-saves the token to a variable.
