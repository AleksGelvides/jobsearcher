package ru.gelvides.core.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import ru.gelvides.core.mappers.AbstractMapper;

import java.util.Objects;

import static ru.gelvides.core.consts.Constants.ENTITY_NOT_FOUND_EXCEPTION_TEXT;

public abstract class AbstractCrudService<ENTITY, IDENTITY, DTO> {
    private final JpaRepository<ENTITY ,IDENTITY> repository;
    private final AbstractMapper<DTO, ENTITY> mapper;
    private final Class<ENTITY> entityClass;

    public AbstractCrudService(JpaRepository<ENTITY, IDENTITY> repository, AbstractMapper<DTO, ENTITY> mapper, Class<ENTITY> entityClass) {
        this.repository = repository;
        this.mapper = mapper;
        this.entityClass = entityClass;
    }

    @Transactional
    DTO save(DTO dto) {
        ENTITY entinty = mapper.toEntity(dto);

        if (Objects.nonNull(getId(entinty))) {
            var existenceEntityOptional = repository.findById(getId(entinty));
            if (existenceEntityOptional.isPresent()) {
                var existenceEntity = existenceEntityOptional.get();
                mapper.update(entinty, existenceEntity);
                entinty = repository.save(existenceEntity);
            } else {
                throw new EntityNotFoundException(
                        ENTITY_NOT_FOUND_EXCEPTION_TEXT.formatted(entityClass.getSimpleName(), getId(entinty)));
            }
        } else {
            entinty = repository.save(entinty);
        }
        return mapper.toDto(entinty);
    }

    @Transactional(readOnly = true)
    public DTO findById(IDENTITY id) {
        return mapper.toDto(
                repository.findById(id).orElseThrow(
                        () -> new EntityNotFoundException(
                                ENTITY_NOT_FOUND_EXCEPTION_TEXT.formatted(entityClass.getSimpleName(), id))
                ));
    }

    @Transactional
    public void deleteById(IDENTITY id) {
        repository.deleteById(id);
    }




    protected abstract IDENTITY getId(ENTITY entity);
}
