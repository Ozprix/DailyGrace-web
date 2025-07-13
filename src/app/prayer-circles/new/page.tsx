
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createPrayerCircle } from "@/services/prayer-circle.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function NewPrayerCirclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a circle.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Prayer circle name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newCircleId = await createPrayerCircle(
        name,
        description,
        user.uid,
        user.displayName || "Anonymous",
        isPrivate
      );
      toast({
        title: "Success!",
        description: `Your prayer circle "${name}" has been created.`,
      });
      router.push(`/prayer-circles`); // Redirect to the list page
    } catch (error) {
      console.error("Failed to create prayer circle:", error);
      toast({
        title: "Creation Failed",
        description: "Could not create the prayer circle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Circles
      </Button>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Prayer Circle</CardTitle>
            <CardDescription>
              Build a community of prayer and support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="circle-name">Circle Name</Label>
              <Input
                id="circle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 'Morning Prayers'"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="circle-description">Description (Optional)</Label>
              <Textarea
                id="circle-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the focus of this prayer circle?"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="private-switch"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private-switch" className="cursor-pointer">
                Private Circle (invitation only)
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Circle
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
