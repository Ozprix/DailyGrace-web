
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { embed } from "@genkit-ai/ai/embedder";
import { googleAIEmbedder } from "@genkit-ai/googleai/embedder";
import { allBibleVerses } from "@/lib/bible-verses";
import { Document } from "@genkit-ai/ai/retriever";

export async function GET() {
  try {
    const pinecone = new Pinecone();
    const index = pinecone.Index("bible-verses");

    console.log("Starting to seed Pinecone via API route...");

    const documents = allBibleVerses.map((verse) =>
      Document.fromText(verse.text, { reference: verse.reference })
    );

    const embeddings = await embed({
      embedder: googleAIEmbedder(),
      content: documents,
    });

    const vectors = embeddings.map((embedding, i) => ({
      id: documents[i].metadata.reference as string,
      values: embedding,
      metadata: {
        reference: documents[i].metadata.reference as string,
        text: documents[i].text(),
      },
    }));

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`Upserted batch ${i / batchSize + 1}`);
    }

    console.log("Pinecone seeding complete!");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pinecone seeding failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
