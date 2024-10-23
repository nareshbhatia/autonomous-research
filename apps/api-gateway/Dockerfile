FROM node:20

WORKDIR /api-gateway
COPY . .

# can't run npm ci because lockfile is at repository root
RUN npm install

CMD ["node", "dist"]
