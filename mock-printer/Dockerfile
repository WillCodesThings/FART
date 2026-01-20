FROM node:20-alpine

WORKDIR /app

# Install tsx globally
RUN npm install -g tsx

# Copy the server file
COPY server.ts .

EXPOSE 8888

CMD ["tsx", "server.ts"]
