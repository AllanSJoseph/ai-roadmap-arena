FROM node:slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN chmod +x /app/entrypoint.sh

USER node

EXPOSE 5000

CMD ["/app/entrypoint.sh"]
