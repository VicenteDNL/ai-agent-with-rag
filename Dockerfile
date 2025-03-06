FROM node:22.14.0

WORKDIR /app

RUN npm install -g typescript 

ENTRYPOINT ["tail", "-f", "/dev/null"]