package ru.gelvides.application.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.gelvides.application.configurations.JobSearcherAuthConfiguration;

import java.security.Principal;

@RestController
public class LoginEntryController {
    private final JobSearcherAuthConfiguration jobSearcherAuthConfiguration;

    public LoginEntryController(JobSearcherAuthConfiguration jobSearcherAuthConfiguration) {
        this.jobSearcherAuthConfiguration = jobSearcherAuthConfiguration;
    }

    @GetMapping("/__jobpilot/session")
    ResponseEntity<Void> session(Principal principal) {
        return principal == null ? ResponseEntity.status(401).build() : ResponseEntity.noContent().build();
    }

    @GetMapping("/login")
    ResponseEntity<Void> login(@RequestParam(required = false) String error) {
        String destination = error != null ? "/oauth2/authorization/keycloak?retry" : "/oauth2/authorization/keycloak";
        return ResponseEntity.status(302).location(jobSearcherAuthConfiguration.callback().resolve(destination)).build();
    }
}
