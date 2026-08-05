from __future__ import annotations

import functools
import logging
from typing import Any, Callable, TypeVar

logger = logging.getLogger(__name__)

ReturnType = TypeVar("ReturnType")


def log_repo_call(function: Callable[..., ReturnType]) -> Callable[..., ReturnType]:
    @functools.wraps(function)
    def wrapper(*args: Any, **kwargs: Any) -> ReturnType:
        logger.debug("Repository call: %s", function.__name__)
        return function(*args, **kwargs)

    return wrapper
