package ru.gelvides.application.configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;

@ConfigurationProperties(prefix = "jobpilot.auth")
public record JobSearcherAuthConfiguration(
        URI callback
) {
}
