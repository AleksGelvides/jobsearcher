package ru.gelvides.resumemodule.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;
import ru.gelvides.core.mappers.AbstractMapper;
import ru.gelvides.resumemodule.domain.dto.ExperienceDto;
import ru.gelvides.resumemodule.domain.entinty.Experience;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExperienceMapper extends AbstractMapper<ExperienceDto, Experience> { }
