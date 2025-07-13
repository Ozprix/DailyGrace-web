
import { NextResponse } from "next/server";

export async function GET() {
  // This feature has been deprecated because the @genkit-ai/pinecone package was not found
  // and was causing npm install failures. The related Topical Search feature has been removed.
  console.log("Pinecone seeding API called, but feature is deprecated.");
  return NextResponse.json(
    {
      success: false,
      message: "This feature has been deprecated due to dependency issues.",
    },
    { status: 410 }
  );
}
