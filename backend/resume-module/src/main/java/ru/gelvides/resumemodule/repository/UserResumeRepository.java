package ru.gelvides.resumemodule.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.gelvides.resumemodule.domain.entinty.UserResume;

@Repository
public interface UserResumeRepository extends JpaRepository<UserResume, Long> {
}
