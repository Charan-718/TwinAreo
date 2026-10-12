"""Shared mapping from service exceptions to HTTP errors."""

from contextlib import contextmanager

from fastapi import HTTPException

from backend.services.twin_service import ArtifactsMissing


@contextmanager
def service_errors():
    try:
        yield
    except ArtifactsMissing as e:
        raise HTTPException(status_code=503, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e).strip("'"))
