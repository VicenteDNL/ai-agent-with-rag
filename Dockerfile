FROM node:22.14.0

WORKDIR /app

ENTRYPOINT ["tail", "-f", "/dev/null"]