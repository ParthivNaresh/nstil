class TokenExpiredError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class TokenRevokedError(Exception):
    pass


class ProfileCreationError(Exception):
    pass
