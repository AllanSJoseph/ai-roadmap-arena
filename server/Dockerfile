FROM node:slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

USER node

EXPOSE 5000

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
