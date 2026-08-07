from __future__ import annotations


class DomainException(Exception):
    pass


class ValidationException(DomainException):
    pass


class ClassPlanNotFoundException(DomainException):
    pass


class ClassPlanTopicNotFoundException(DomainException):
    pass


class GenerationNotFoundException(DomainException):
    pass


class GenerationInProgressException(DomainException):
    pass


class ClassroomSessionNotFoundException(DomainException):
    pass


class DoubtSessionNotFoundException(DomainException):
    pass


class InvalidWorkflowStateException(DomainException):
    pass


class TopicNotFoundException(DomainException):
    pass


class StudentProfileNotFoundException(DomainException):
    pass


class LearningSessionNotFoundException(DomainException):
    pass


class LearningSessionNotActiveException(DomainException):
    pass
