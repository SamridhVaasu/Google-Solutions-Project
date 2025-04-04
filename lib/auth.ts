/**
 * Utility to fetch OLA Maps OAuth token
 */
export async function getOlaMapsToken(): Promise<string | null> {
  try {
    const clientId = process.env.NEXT_PUBLIC_OLAMAPS_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_OLAMAPS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("OLA Maps client credentials not found");
      return null;
    }

    const response = await fetch(
      "https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: "openid",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting OLA Maps token:", error);
    return null;
  }
}
