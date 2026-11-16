package ru.gelvides.resumemodule.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import ru.gelvides.core.mappers.AbstractMapper;
import ru.gelvides.core.service.AbstractCrudService;
import ru.gelvides.resumemodule.domain.dto.UserResumeDto;
import ru.gelvides.resumemodule.domain.entinty.UserResume;

@Service
public class UserResumeService extends AbstractCrudService<UserResume, Long, UserResumeDto> {

    public UserResumeService(JpaRepository<UserResume, Long> repository,
                             AbstractMapper<UserResumeDto, UserResume> mapper,
                             Class<UserResume> userResumeClass) {
        super(repository, mapper, userResumeClass);
    }

    @Override
    protected Long getId(UserResume userResume) {
        return userResume.getId();
    }
}
