FROM node:18.17.1

WORKDIR /app

COPY package.json /app
RUN npm install

COPY index.js .

ENV PORT 80
ENV NODE_ENV docker
ENV REDIS_HOST redis
ENV REDIS_PORT 6379

CMD ["npm", "start"]
