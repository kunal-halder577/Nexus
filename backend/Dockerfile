FROM node:lts-alpine as base
WORKDIR /backend

#For Development
FROM base as development
COPY package*.json .
RUN npm ci --include=dev
CMD ["npm", "run", "dev"]

#For Production
FROM base as production
COPY package*.json .
RUN npm ci --omit=dev
COPY . .

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]