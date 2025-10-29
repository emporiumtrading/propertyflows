import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  tutorialKey: string;
}

export function InteractiveTutorial({ steps, onComplete, onSkip, tutorialKey }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(`tutorial_${tutorialKey}`);
    if (!hasSeenTutorial) {
      setIsActive(true);
    }
  }, [tutorialKey]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const targetElement = document.querySelector(`[data-testid="${steps[currentStep].target}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const stepPosition = steps[currentStep].position || "bottom";
        const cardWidth = 384;
        const cardHeight = 250;
        const padding = 20;
        
        let top = 0;
        let left = 0;

        const targetCenterX = rect.left + window.scrollX + (rect.width / 2);
        const targetCenterY = rect.top + window.scrollY + (rect.height / 2);

        switch (stepPosition) {
          case "bottom":
            top = rect.bottom + window.scrollY + 10;
            left = targetCenterX - (cardWidth / 2);
            break;
          case "top":
            top = rect.top + window.scrollY - cardHeight - 10;
            left = targetCenterX - (cardWidth / 2);
            break;
          case "left":
            top = targetCenterY - (cardHeight / 2);
            left = rect.left + window.scrollX - cardWidth - 10;
            break;
          case "right":
            top = targetCenterY - (cardHeight / 2);
            left = rect.right + window.scrollX + 10;
            break;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;

        const minLeft = padding;
        const maxLeft = viewportWidth - cardWidth - padding;
        const minTop = scrollY + padding;
        const maxTop = scrollY + viewportHeight - cardHeight - padding;

        left = Math.max(minLeft, Math.min(left, maxLeft));
        top = Math.max(minTop, Math.min(top, maxTop));

        setPosition({ top, left });

        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        targetElement.classList.add("tutorial-highlight");
      } else {
        const defaultPosition = {
          left: window.innerWidth / 2 - 192,
          top: window.scrollY + 100
        };
        setPosition(defaultPosition);
      }
    }

    return () => {
      document.querySelectorAll(".tutorial-highlight").forEach((el) => {
        el.classList.remove("tutorial-highlight");
      });
    };
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, "true");
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, "true");
    setIsActive(false);
    onSkip?.();
  };

  if (!isActive || !steps[currentStep]) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" data-testid="tutorial-overlay" />
      
      <Card
        className="fixed z-50 w-96 shadow-2xl"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        data-testid="tutorial-card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-2"
              onClick={handleSkip}
              data-testid="button-skip-tutorial"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-2">{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step.action && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                👉 {step.action}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous-step"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              data-testid="button-skip-all"
            >
              Skip Tutorial
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              data-testid="button-next-step"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function useTutorial(tutorialKey: string) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(`tutorial_${tutorialKey}`);
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tutorialKey]);

  const startTutorial = () => {
    localStorage.removeItem(`tutorial_${tutorialKey}`);
    setShowTutorial(true);
  };

  const resetAllTutorials = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tutorial_")) {
        localStorage.removeItem(key);
      }
    });
    setShowTutorial(true);
  };

  return { showTutorial, startTutorial, resetAllTutorials };
}
