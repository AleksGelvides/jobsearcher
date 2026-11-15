package ru.gelvides.application.auth;

import java.net.URI;
import java.security.Principal;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@Configuration
class JobPilotSecurity {

    @Bean
    ClientRegistrationRepository keycloakClient(
            @Value("${jobpilot.auth.issuer}") String issuer,
            @Value("${jobpilot.auth.internal-issuer}") String internalIssuer,
            @Value("${jobpilot.auth.callback}") String callback) {
        return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("keycloak")
                .clientId("jobpilot")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .clientSettings(ClientRegistration.ClientSettings.builder().requireProofKey(true).build())
                .redirectUri(callback)
                .scope("openid", "email", "profile")
                .issuerUri(issuer)
                .authorizationUri(issuer + "/protocol/openid-connect/auth")
                .tokenUri(internalIssuer + "/protocol/openid-connect/token")
                .jwkSetUri(internalIssuer + "/protocol/openid-connect/certs")
                .build());
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, ClientRegistrationRepository clients) {
        var resolver = new DefaultOAuth2AuthorizationRequestResolver(
                clients, OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI);
        var requestResolver = new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request) {
                var authorization = resolver.resolve(request);
                if (authorization == null || request.getParameter("retry") == null) return authorization;
                return OAuth2AuthorizationRequest.from(authorization)
                        .additionalParameters(params -> {
                            params.put("prompt", "login");
                        }).build();
            }

            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request, String registrationId) {
                return resolver.resolve(request, registrationId);
            }
        };
        http.authorizeHttpRequests(requests -> requests
                        .requestMatchers(
                                "/login",
                                "/login/oauth2/code/keycloak",
                                "/oauth2/authorization/keycloak",
                                "/error",
                                "/__jobpilot/session").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(login -> login.loginPage("/login")
                        .authorizationEndpoint(endpoint ->
                                endpoint.authorizationRequestResolver(requestResolver))
                        .defaultSuccessUrl("/#/profile", true)
                        .failureUrl("/login?error"));
        return http.build();
    }
}