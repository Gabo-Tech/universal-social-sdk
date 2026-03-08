import { Instagram } from "universal-social-sdk";

async function main() {
  const result = await Instagram.uploadReel({
    videoUrl: "https://example.com/reel.mp4",
    caption: "Hello from universal-social-sdk reel example!"
  });

  console.log("Instagram reel result:", result);
}

main().catch((error) => {
  console.error("Failed to publish reel:", error);
  process.exit(1);
});
