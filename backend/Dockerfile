FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY application/target/application-0.0.1-SNAPSHOT.jar app.jar
RUN useradd --create-home --uid 10001 jobpilot
USER 10001
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
