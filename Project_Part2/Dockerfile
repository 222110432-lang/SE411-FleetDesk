FROM node:24-alpine AS frontend
WORKDIR /work/frontend
COPY frontend/package*.json ./
RUN npm ci --no-fund --no-audit
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /work/backend
COPY backend/ ./
COPY --from=frontend /work/frontend/dist /work/frontend/dist
RUN mvn -B -ntp verify

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S fleetdesk && adduser -S fleetdesk -G fleetdesk && chown fleetdesk:fleetdesk /app
COPY --from=build /work/backend/target/fleetdesk.jar /app/fleetdesk.jar
USER fleetdesk
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/fleetdesk.jar"]
