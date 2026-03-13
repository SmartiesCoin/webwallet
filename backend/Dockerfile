FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

EXPOSE 3001

USER node

CMD ["node", "dist/index.js"]
