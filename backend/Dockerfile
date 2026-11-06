FROM amazoncorretto:25
ENV APP_HOME=usr/app
COPY /application/target/*SNAPSHOT.jar aplication.jar
EXPOSE 8080
CMD ["java", "-jar", "aplication.jar"]