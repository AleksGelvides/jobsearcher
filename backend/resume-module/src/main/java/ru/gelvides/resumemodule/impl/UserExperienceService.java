package ru.gelvides.resumemodule.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import ru.gelvides.core.service.AbstractCrudService;
import ru.gelvides.resumemodule.domain.dto.ExperienceDto;
import ru.gelvides.resumemodule.domain.entinty.Experience;
import ru.gelvides.resumemodule.mapper.ExperienceMapper;

@Service
public class UserExperienceService
        extends AbstractCrudService<Experience, Long, ExperienceDto> {

    public UserExperienceService(JpaRepository<Experience, Long> repository,
                                 ExperienceMapper mapper,
                                 Class<Experience> experienceClass) {
        super(repository, mapper, experienceClass);
    }

    @Override
    protected Long getId(Experience experience) {
        return experience.getId();
    }

}
