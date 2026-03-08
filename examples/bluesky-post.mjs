import { Bluesky } from "universal-social-sdk";

async function main() {
  const result = await Bluesky.postText({
    text: "Hello from universal-social-sdk Bluesky example!"
  });

  console.log("Bluesky post result:", result);
}

main().catch((error) => {
  console.error("Failed to create Bluesky post:", error);
  process.exit(1);
});
