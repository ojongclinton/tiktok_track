async function getTikTokUserStats(username) {
  try {
    const url = `https://www.tiktok.com/@${username.trim()}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Helper to extract JSON object after a key
    const extractJSON = (key) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*(\\{.*?\\})(?=,\\s*"\\w+")`, "s");
      const match = html.match(regex);
      if (!match) return null;
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    };

    const stats = extractJSON("stats");
    const statsV2 = extractJSON("statsV2");
    const shareMeta = extractJSON("shareMeta");

    return { stats, statsV2, shareMeta };
  } catch (err) {
    console.error("Error fetching TikTok stats:", err);
    return null;
  }
}

// Example usage
(async () => {
  const data = await getTikTokUserStats("tiktok");
  console.log(data);
})();
