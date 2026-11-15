package ru.gelvides.application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import ru.gelvides.application.configurations.JobSearcherAuthConfiguration;

@SpringBootApplication
@EnableConfigurationProperties(JobSearcherAuthConfiguration.class)
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
