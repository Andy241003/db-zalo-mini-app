FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for some python packages
RUN apt-get update && apt-get install -y build-essential gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/app/requirements.txt ./backend/app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r backend/app/requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Expose port (Fly uses $PORT at runtime)
ENV PORT=8080
EXPOSE 8080

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
