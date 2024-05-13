FROM node:20-alpine

WORKDIR /app/youtubelite

COPY . .

RUN npm install --omit=dev

EXPOSE 8000

CMD [ "npm","start" ]