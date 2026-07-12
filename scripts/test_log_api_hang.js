async function main() {
  console.log("Calling local /api/log to diagnose hang...");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    const response = await fetch("http://localhost:3000/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        walletAddress: "AkytLyJnoK55QMp1mMmPVtXMNWB7HK3ZuLWDVu8ruBGp",
        type: "text",
        content: "Hello so today I learnt umm JavaScript functions, variables and standard syntax.",
        title: "Learn JavaScript",
        duration: 15,
        instrument: "general"
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Diagnosis: The /api/log API call HUNG for more than 10 seconds!");
    } else {
      console.error("API call failed with error:", error);
    }
  }
}

main();
