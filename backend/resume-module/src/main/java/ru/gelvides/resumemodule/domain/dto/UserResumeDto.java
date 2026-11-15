package ru.gelvides.resumemodule.domain.dto;

import ru.gelvides.resumemodule.domain.enums.SeniorityLevel;

import java.util.Set;

public record UserResumeDto (
        Long id,
        String name,
        String city,
        String desiredPosition,
        SeniorityLevel seniorityLevel,
        SeniorityLevel workingFormat,
        String about,
        Set<ExperienceDto> experiences
) { }
