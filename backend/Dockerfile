FROM eclipse-temurin:25-jre-noble
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /app
COPY application/target/application-0.0.1-SNAPSHOT.jar app.jar
RUN java -Dloader.main=com.microsoft.playwright.CLI -cp app.jar \
        org.springframework.boot.loader.launch.PropertiesLauncher install --with-deps chromium --only-shell \
    && apt-get purge -y xvfb xserver-common \
    && useradd --create-home --uid 10001 jobpilot \
    && rm -rf /var/lib/apt/lists/*
USER 10001
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
