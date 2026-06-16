FROM python:3.12-slim

WORKDIR /app

ARG PIP_INDEX_URL=https://pypi.org/simple
ARG PIP_TRUSTED_HOST=

COPY requirements.txt .
RUN python -m pip install --no-cache-dir --retries 10 --timeout 120 \
    --index-url "${PIP_INDEX_URL}" ${PIP_TRUSTED_HOST:+--trusted-host ${PIP_TRUSTED_HOST}} \
    -r requirements.txt

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
