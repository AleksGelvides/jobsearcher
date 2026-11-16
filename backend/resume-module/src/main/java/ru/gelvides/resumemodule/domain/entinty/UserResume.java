package ru.gelvides.resumemodule.domain.entinty;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.BatchSize;
import ru.gelvides.resumemodule.domain.enums.SeniorityLevel;

import java.util.Set;

@Data
@FieldNameConstants
@Entity
@Table(name = "resume")
public class UserResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "city")
    private String city;

    @Column(name = "desired_position", nullable = false)
    private String desiredPosition;

    @Column(name = "employer_level", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private SeniorityLevel employerLevel;

    @Column(name = "working_format")
    @Enumerated(EnumType.ORDINAL)
    private SeniorityLevel workingFormat;

    @Column(name = "about")
    private String about;

    @BatchSize(size = 3)
    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Experience> experiences;
}
