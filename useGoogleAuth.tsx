import { useState, useEffect, useCallback, useRef } from "react";
import type { GoogleTokenResponse, UserProfile } from "./types";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error(
    "Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file."
  );
}

const GMAIL_SCOPES =
  "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

export const useGoogleAuth = () => {
  const [token, setToken] = useState<GoogleTokenResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- SIGN OUT ----
  const handleSignOut = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const storedToken = localStorage.getItem("google_token");
    if (storedToken) {
      const parsedToken = JSON.parse(storedToken);
      window.google?.accounts.oauth2.revoke(parsedToken.access_token, () => {
        console.log("Token revoked");
      });
    }

    console.log('[Auth] Signing out: Clearing token, user data, and localStorage');
    setToken(null);
    setUser(null);
    localStorage.removeItem("google_token");
    localStorage.removeItem("google_user");
  }, []);

  // ---- FETCH USER PROFILE ----
  const fetchUserProfile = useCallback(
    async (accessToken: string) => {
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }

        const profile = await response.json();
        if (!profile.name || !profile.email) {
          throw new Error("Incomplete profile data received");
        }

        const userProfile: UserProfile = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture || "",
        };
        console.log('[Auth] Successfully fetched user profile:', { email: profile.email });

        setUser(userProfile);
        localStorage.setItem("google_user", JSON.stringify(userProfile));
      } catch (error) {
        console.error("Error fetching user profile:", error);
        handleSignOut();
      }
    },
    [handleSignOut]
  );

  // ---- REFRESH TOKEN ----
  const refreshToken = useCallback(() => {
    if (tokenClient) {
      console.log("Refreshing token...");
      tokenClient.requestAccessToken({ prompt: "" });
    }
  }, [tokenClient]);

  // ---- HANDLE AUTH RESPONSE ----
  const handleAuthResponse = useCallback(
    (tokenResponse: GoogleTokenResponse) => {
      console.log('[Auth] Received token response:', { expiresIn: tokenResponse.expires_in });
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const expiryDate = Date.now() + tokenResponse.expires_in * 1000;

      const tokenWithExpiry = {
        ...tokenResponse,
        expiry_date: expiryDate,
      };

      console.log('[Auth] Setting token and storing in localStorage');
      setToken(tokenWithExpiry);
      localStorage.setItem("google_token", JSON.stringify(tokenWithExpiry));
      fetchUserProfile(tokenResponse.access_token);

      // refresh 5 min before expiry
      const timeToRefresh = (tokenResponse.expires_in - 300) * 1000;
      refreshTimerRef.current = setTimeout(() => {
        console.log("Refreshing token before expiry...");
        refreshToken();
      }, timeToRefresh);
    },
    [fetchUserProfile, refreshToken]
  );

  // ---- CHECK STORED TOKEN ----
  const checkAndRefreshToken = useCallback(() => {
    const storedToken = localStorage.getItem("google_token");
    if (storedToken) {
      const parsedToken: GoogleTokenResponse = JSON.parse(storedToken);
      const currentTime = Date.now();

      if (currentTime >= parsedToken.expiry_date) {
        console.log("Token expired, refreshing...");
        refreshToken();
      } else {
        console.log("Token still valid, using stored token");
        setToken(parsedToken);
        fetchUserProfile(parsedToken.access_token);
      }
    }
  }, [refreshToken, fetchUserProfile]);

  // ---- SIGN IN ----
  const handleSignIn = useCallback(() => {
    console.log('[Auth] Starting sign-in process...');
    if (tokenClient) {
      try {
        console.log('[Auth] Requesting access token with consent...');
        tokenClient.requestAccessToken({ prompt: "consent" });
      } catch (error) {
        console.error("Error requesting access token:", error);
        alert("Failed to sign in with Google. Please try again.");
      }
    } else {
      alert("Google Client not initialized.");
    }
  }, [tokenClient]);

  // ---- INIT GOOGLE CLIENT ----
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;

    console.log('[Auth] Initializing Google OAuth client...');
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPES,
      callback: (tokenResponse: GoogleTokenResponse) => {
        handleAuthResponse(tokenResponse);
      },
    });

    setTokenClient(client);

    // Restore user immediately (better UX)
    const storedUser = localStorage.getItem("google_user");
    if (storedUser) setUser(JSON.parse(storedUser));

    // Check stored token validity
    checkAndRefreshToken();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [handleAuthResponse, checkAndRefreshToken]); // Add necessary dependencies

  return { user, token, handleSignIn, handleSignOut };
};
