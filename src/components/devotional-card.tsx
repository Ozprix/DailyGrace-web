
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DevotionalContent } from "@/types";
import { Separator } from "@/components/ui/separator";
import { DevotionalActions } from "./devotional-actions";
import { AudioPlayer } from "./audio/audio-player";

interface DevotionalCardProps {
  devotional: DevotionalContent;
  isCustom?: boolean;
}

export function DevotionalCard({ devotional, isCustom = false }: DevotionalCardProps) {
  const { verse, message, prayerPoint, themes } = devotional;
  const audioText = `Devotional based on ${verse.reference}. Message: ${message}. Prayer: ${prayerPoint}`;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden bg-card/70 backdrop-blur-sm border-border/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-primary tracking-tight">
              {isCustom ? "Your Custom Devotional" : "Today's Devotional"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Based on {verse.reference}
            </CardDescription>
          </div>
          <AudioPlayer textToSpeak={audioText} />
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6 text-foreground/90">
        <blockquote className="border-l-4 border-primary pl-4 italic text-lg">
          "{verse.text}"
        </blockquote>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h3 className="font-semibold text-xl text-foreground">Message</h3>
          <p>{message}</p>
        </div>

        {prayerPoint && (
          <>
            <Separator />
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h3 className="font-semibold text-xl text-foreground">Prayer Point</h3>
              <p>{prayerPoint}</p>
            </div>
          </>
        )}

        {themes && themes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-foreground/80">Related Themes:</h4>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <Badge key={theme} variant="secondary">{theme}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 bg-muted/30 border-t border-border/50">
        <DevotionalActions devotional={devotional} />
      </CardFooter>
    </Card>
  );
}
