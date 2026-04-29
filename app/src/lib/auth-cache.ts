let _userId: string | null = null;
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function cacheAuth(userId: string, accessToken: string, refreshToken: string) {
  _userId = userId;
  _accessToken = accessToken;
  _refreshToken = refreshToken;
}

export function getCachedUserId(): string | null {
  return _userId;
}

export function getCachedTokens(): { access_token: string; refresh_token: string } | null {
  if (!_accessToken || !_refreshToken) return null;
  return { access_token: _accessToken, refresh_token: _refreshToken };
}

export function clearCache() {
  _userId = null;
  _accessToken = null;
  _refreshToken = null;
}
