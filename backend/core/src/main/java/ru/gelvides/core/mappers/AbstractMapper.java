package ru.gelvides.core.mappers;

import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

public interface AbstractMapper<DTO, ENTITY> {

    DTO toDto(ENTITY entity);

    ENTITY toEntity(DTO dto);

    @Mapping(target = "id", ignore = true)
    void update(ENTITY from, @MappingTarget ENTITY to);

}
