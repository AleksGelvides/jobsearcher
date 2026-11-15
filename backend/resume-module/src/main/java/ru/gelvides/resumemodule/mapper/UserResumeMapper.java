package ru.gelvides.resumemodule.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;
import ru.gelvides.core.mappers.AbstractMapper;
import ru.gelvides.resumemodule.domain.dto.UserResumeDto;
import ru.gelvides.resumemodule.domain.entinty.UserResume;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {ExperienceMapper.class})
public interface UserResumeMapper extends AbstractMapper<UserResumeDto, UserResume> { }
