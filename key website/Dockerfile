# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/server.js"]
