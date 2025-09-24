# syntax=docker/dockerfile:1.4

FROM node:20-bullseye AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

FROM node:20-bullseye AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bullseye AS runner
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production
ENV PORT=8080
RUN npm prune --omit=dev
EXPOSE 8080
CMD ["npm", "start"]
