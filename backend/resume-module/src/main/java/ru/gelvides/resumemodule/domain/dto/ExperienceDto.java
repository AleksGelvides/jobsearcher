package ru.gelvides.resumemodule.domain.dto;

import java.time.LocalDate;

public record ExperienceDto(
        Long id,
        String company,
        String position,
        LocalDate from,
        LocalDate to,
        String description,
        UserResumeDto resume
) { }
