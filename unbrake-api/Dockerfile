FROM python:3.7-alpine

LABEL description="To be used in django development, just to keep environments unified between users and reduce complexity."

ENV PYTHONUNBUFFERED TRUE

WORKDIR /app/api

COPY requirements.txt .

RUN set +x \
    && apk add --no-cache build-base git \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN set +x \
  && ln -s "$PWD/scripts/check" /usr/local/bin \
  && rm -rf secrets

EXPOSE 8080

ENTRYPOINT ["/app/api/scripts/entrypoint.dev"]
CMD ["runserver", "0.0.0.0:8080"]
