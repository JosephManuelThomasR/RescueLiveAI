FROM python:3.11-slim
WORKDIR /app
COPY rescue_live_ai/backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY rescue_live_ai/backend /app
EXPOSE 8080
CMD ["python", "-m", "rescue_live_ai.backend.app"]
