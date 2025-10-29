import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveTutorial, useTutorial } from "@/components/InteractiveTutorial";
import { getTutorialForPage } from "@/lib/tutorials";
import { useToast } from "@/hooks/use-toast";

interface PageTutorialProps {
  pagePath: string;
}

export function PageTutorial({ pagePath }: PageTutorialProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const tutorialContent = getTutorialForPage(pagePath, user?.role);
  
  if (!tutorialContent) {
    return null;
  }

  const { showTutorial } = useTutorial(tutorialContent.key);

  if (!showTutorial) {
    return null;
  }

  return (
    <InteractiveTutorial
      steps={tutorialContent.steps}
      tutorialKey={tutorialContent.key}
      onComplete={() => toast({
        title: "Tutorial Complete!",
        description: `You've completed the ${tutorialContent.title} tutorial.`,
      })}
      onSkip={() => toast({
        title: "Tutorial Skipped",
        description: "You can restart it anytime from the tutorials button.",
      })}
    />
  );
}
