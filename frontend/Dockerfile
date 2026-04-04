# Build stage
FROM node:20-alpine AS build
WORKDIR /app
# Remove package-lock.json to avoid sync issues for now if needed, or keep it.
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV REACT_APP_API_URL=https://billsoft.agbitsolutions.com/api
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
