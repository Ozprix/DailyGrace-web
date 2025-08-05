'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Star, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Bug,
  Lightbulb,
  Heart,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { errorTrackingService } from '@/lib/error-tracking/error-service';
import { useAuth } from '@/contexts/auth-context';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'praise';
  rating: number;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something isn\'t working' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'I have an idea' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'General thoughts' },
  { value: 'praise', label: 'Praise', icon: Heart, description: 'Something I love' },
];

const FEEDBACK_CATEGORIES = [
  'User Interface',
  'Performance',
  'Content',
  'Navigation',
  'Authentication',
  'Offline Functionality',
  'Notifications',
  'Other',
];

export function UserFeedback() {
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    rating: 5,
    message: '',
    category: 'Other',
    priority: 'medium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.message.trim()) {
      setError('Please provide feedback details');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Track feedback in error tracking service
      errorTrackingService.trackUserFeedback(
        feedback.message,
        feedback.rating,
        {
          userId: user?.uid,
          userEmail: user?.email || undefined,
          page: window.location.pathname,
          action: 'user_feedback',
          component: 'UserFeedback',
          additionalData: {
            feedbackType: feedback.type,
            feedbackCategory: feedback.category,
            feedbackPriority: feedback.priority,
          },
        }
      );

      // Here you would typically send to your backend
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedback),
      // });

      setIsSubmitted(true);
      setFeedback({
        type: 'general',
        rating: 5,
        message: '',
        category: 'Other',
        priority: 'medium',
      });
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setError(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    const feedbackType = FEEDBACK_TYPES.find(t => t.value === type);
    return feedbackType ? feedbackType.icon : MessageSquare;
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Thank You!</CardTitle>
          <CardDescription>
            Your feedback has been submitted successfully. We appreciate your input!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleReset} variant="outline">
            Submit More Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Share Your Feedback
        </CardTitle>
        <CardDescription>
          Help us improve Daily Grace by sharing your thoughts, reporting issues, or suggesting features.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Feedback Type */}
          <div className="space-y-3">
            <Label>What type of feedback is this?</Label>
            <RadioGroup
              value={feedback.type}
              onValueChange={(value) => setFeedback(prev => ({ ...prev, type: value as any }))}
              className="grid grid-cols-2 gap-4"
            >
              {FEEDBACK_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>How would you rate your experience?</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant={feedback.rating >= star ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                  className="w-10 h-10 p-0"
                >
                  <Star className="w-4 h-4 fill-current" />
                </Button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {feedback.rating === 1 && 'Poor'}
                {feedback.rating === 2 && 'Fair'}
                {feedback.rating === 3 && 'Good'}
                {feedback.rating === 4 && 'Very Good'}
                {feedback.rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label>Category</Label>
            <select
              value={feedback.category}
              onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {FEEDBACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>Priority</Label>
            <RadioGroup
              value={feedback.priority}
              onValueChange={(value) => setFeedback(prev => ({ ...prev, priority: value as any }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Low
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Medium
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    High
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label htmlFor="feedback-message">Your Feedback</Label>
            <Textarea
              id="feedback-message"
              placeholder="Please describe your feedback in detail..."
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {feedback.message.length}/1000 characters
            </div>
          </div>

          {/* Preview */}
          {feedback.message && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Feedback Preview:</h4>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(feedback.priority)}>
                  {feedback.priority} Priority
                </Badge>
                <Badge variant="outline">
                  {feedback.category}
                </Badge>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${feedback.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{feedback.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !feedback.message.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default UserFeedback; 