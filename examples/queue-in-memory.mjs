import { setQueueAdapter, InMemoryQueueAdapter, X } from "universal-social-sdk";

setQueueAdapter(new InMemoryQueueAdapter());

async function main() {
  const result = await X.scheduleTweet({
    text: "Queued tweet from universal-social-sdk",
    publishAt: new Date(Date.now() + 3000)
  });

  console.log("Scheduled result:", result);
}

main().catch((error) => {
  console.error("Queue example failed:", error);
  process.exit(1);
});
