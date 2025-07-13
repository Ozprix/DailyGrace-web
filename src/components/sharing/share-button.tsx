
"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  hashtag?: string; // New prop
}

export const ShareButton = ({ url, title, text, hashtag }: ShareButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");
  const encodedText = encodeURIComponent(text || `Check this out: ${title || ''}`);
  const encodedHashtag = hashtag ? encodeURIComponent(hashtag) : '';


  const shareOptions = [
    {
      name: "Facebook",
      icon: <Facebook className="h-6 w-6" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-6 w-6" />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}${encodedHashtag ? `&hashtags=${encodedHashtag}` : ''}`,
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-6 w-6" />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
    },
    {
      name: "Email",
      icon: <Mail className="h-6 w-6" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${url}`,
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: "Copied to clipboard!",
          description: "You can now share the link.",
        });
        setOpen(false);
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to your clipboard.",
          variant: "destructive",
        });
        console.error("Failed to copy text: ", err);
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {shareOptions.map((option) => (
            <a
              key={option.name}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {option.icon}
              <span className="text-xs">{option.name}</span>
            </a>
          ))}
        </div>
        <Button
            variant="ghost"
            onClick={copyToClipboard}
            className="flex w-full items-center justify-start gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 mt-2 text-sm"
        >
            <LinkIcon className="h-4 w-4" />
            <span>Copy Link</span>
        </Button>
      </PopoverContent>
    </Popover>
  );
};
