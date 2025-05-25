# mcp/Dockerfile
FROM python:3.9-slim-buster
WORKDIR /app
COPY requirements.txt ./
# Ensure pip is up to date and then install dependencies
RUN pip install --upgrade pip && \
   pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
# Explicitly run uvicorn as a command array
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]