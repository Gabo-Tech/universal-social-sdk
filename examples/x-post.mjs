import { X } from "universal-social-sdk";

async function main() {
  const result = await X.postTweet({
    text: "Hello from universal-social-sdk example!"
  });

  console.log("Tweet result:", result);
}

main().catch((error) => {
  console.error("Failed to post tweet:", error);
  process.exit(1);
});
