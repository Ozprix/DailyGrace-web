
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  getPrayerCircle,
  getPrayerRequests,
  addPrayerRequest,
  markAsPrayedFor,
} from "@/services/prayer-circle.service";
import type { PrayerCircle, PrayerRequest } from "@/types/prayer-circle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, HandHelping } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PrayerCircleDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const circleId = params.circleId as string;

  const [circle, setCircle] = useState<PrayerCircle | null>(null);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [newRequestText, setNewRequestText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCircleData = async () => {
      setIsLoading(true);
      try {
        const [circleData, requestsData] = await Promise.all([
          getPrayerCircle(circleId),
          getPrayerRequests(circleId),
        ]);

        if (circleData) {
          setCircle(circleData);
          setRequests(requestsData);
        } else {
          toast({
            title: "Not Found",
            description: "This prayer circle does not exist.",
            variant: "destructive",
          });
          router.push("/prayer-circles");
        }
      } catch (error) {
        console.error("Failed to fetch circle data:", error);
        toast({
          title: "Error",
          description: "Could not load the prayer circle.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };

    if (circleId) {
      fetchCircleData();
    }
  }, [circleId, toast, router]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRequestText.trim()) return;

    setIsSubmitting(true);
    try {
      const newRequestId = await addPrayerRequest(
        circleId,
        user.uid,
        user.displayName || "Anonymous",
        newRequestText
      );
      // Optimistically update the UI
      const newRequest: PrayerRequest = {
        id: newRequestId,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        text: newRequestText,
        createdAt: new Date(), // This will be a client-side approximation
        prayedForBy: [],
      };
      setRequests((prev) => [newRequest, ...prev]);
      setNewRequestText("");
    } catch (error) {
      console.error("Failed to add prayer request:", error);
      toast({
        title: "Submission Failed",
        description: "Could not add your prayer request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMarkAsPrayedFor = async (requestId: string) => {
    if (!user) return;
  
    try {
      await markAsPrayedFor(circleId, requestId, user.uid);
      // Optimistically update the UI
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, prayedForBy: [...req.prayedForBy, user.uid] }
            : req
        )
      );
    } catch (error) {
      console.error("Failed to mark as prayed for:", error);
      toast({
        title: "Error",
        description: "Could not update the prayer status.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!circle) {
    return null; // or a not-found component
  }
  
  // Check if the current user is a member (for private circles)
  const isMember = circle.memberUids.includes(user?.uid || "");
  if (circle.isPrivate && !isMember) {
      toast({
          title: "Access Denied",
          description: "This is a private prayer circle.",
          variant: "destructive"
      });
      router.push("/prayer-circles");
      return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/prayer-circles")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to All Circles
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{circle.name}</CardTitle>
          <CardDescription>{circle.description}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Created by {circle.members.find(m => m.role === 'owner')?.name || 'Unknown'}
            </p>
        </CardContent>
      </Card>
      
      {isMember && (
          <Card className="mb-8">
              <CardHeader>
                  <CardTitle>Submit a Prayer Request</CardTitle>
              </CardHeader>
              <form onSubmit={handleAddRequest}>
                  <CardContent>
                      <Textarea
                          value={newRequestText}
                          onChange={(e) => setNewRequestText(e.target.value)}
                          placeholder="Share what's on your heart..."
                          required
                      />
                  </CardContent>
                  <CardFooter>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Send className="mr-2 h-4 w-4" /> Submit Prayer
                      </Button>
                  </CardFooter>
              </form>
          </Card>
      )}


      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Prayer Wall</h2>
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <p className="mb-4">{request.text}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  <p>
                    by {request.authorName} -{" "}
                    {formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true })}
                  </p>
                  <p>
                    Prayed for by {request.prayedForBy.length} member(s)
                  </p>
                </div>
                {user && !request.prayedForBy.includes(user.uid) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsPrayedFor(request.id)}
                  >
                    <HandHelping className="mr-2 h-4 w-4" /> I Prayed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
