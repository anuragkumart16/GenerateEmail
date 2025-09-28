import React, { useState, useEffect, useCallback } from 'react';
import type { GoogleTokenResponse, UserProfile } from './types';

// IMPORTANT: Add your Google Cloud Client ID to your .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
}
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export const useGoogleAuth = () => {
    const [token, setToken] = useState<GoogleTokenResponse | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
            console.error("Google Client ID is not configured. Please add it to your environment variables.");
        }

        const storedToken = localStorage.getItem('google_token');
        const storedUser = localStorage.getItem('google_user');

        if (storedToken && storedUser) {
            const parsedToken = JSON.parse(storedToken);
            // Check if token is expired
            if (new Date().getTime() < parsedToken.expiry_date) {
                setToken(parsedToken);
                setUser(JSON.parse(storedUser));
            } else {
                localStorage.removeItem('google_token');
                localStorage.removeItem('google_user');
            }
        }
        
        if (window.google) {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GMAIL_SCOPES,
                callback: (tokenResponse: GoogleTokenResponse) => {
                    handleAuthResponse(tokenResponse);
                },
            });
            setTokenClient(client);
        }
    }, []);

    const fetchUserProfile = async (accessToken: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ''}`);
            }
            const profile = await response.json();
            if (!profile.name || !profile.email) {
                throw new Error('Incomplete profile data received');
            }
            const userProfile: UserProfile = {
                name: profile.name,
                email: profile.email,
                picture: profile.picture || '',
            };
            setUser(userProfile);
            localStorage.setItem('google_user', JSON.stringify(userProfile));
        } catch (error) {
            console.error("Error fetching user profile:", error);
            handleSignOut();
            throw error; // Re-throw to be handled by the caller
        }
    };
    
    const handleAuthResponse = (tokenResponse: GoogleTokenResponse) => {
        const expiryDate = new Date().getTime() + tokenResponse.expires_in * 1000;
        const tokenWithExpiry = { ...tokenResponse, expiry_date: expiryDate };
        setToken(tokenWithExpiry);
        localStorage.setItem('google_token', JSON.stringify(tokenWithExpiry));
        fetchUserProfile(tokenResponse.access_token);
    };

    const handleSignIn = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
            console.error("Google token client not initialized.");
            if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
                alert("Google Client ID is not configured. Please follow the setup instructions.");
            }
        }
    };

    const handleSignOut = useCallback(() => {
        const storedToken = localStorage.getItem('google_token');
        if (storedToken) {
            const parsedToken = JSON.parse(storedToken);
            window.google?.accounts.oauth2.revoke(parsedToken.access_token, () => {
                console.log('Token revoked');
            });
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('google_token');
        localStorage.removeItem('google_user');
    }, []);

    return { user, token, handleSignIn, handleSignOut };
};