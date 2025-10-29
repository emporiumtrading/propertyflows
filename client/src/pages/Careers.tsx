import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, DollarSign } from "lucide-react";

export default function Careers() {
  const openings = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-primary" data-testid="link-home">PropertyFlows</a>
          </Link>
          <Button 
              size="sm" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
        </div>
      </nav>

      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center" data-testid="heading-careers">
          Join Our Team
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Help us revolutionize property management
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center">
            <Briefcase className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Remote-First</h3>
            <p className="text-sm text-muted-foreground">Work from anywhere</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Competitive Pay</h3>
            <p className="text-sm text-muted-foreground">Market-leading compensation</p>
          </div>
          <div className="text-center">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Flexible Schedule</h3>
            <p className="text-sm text-muted-foreground">Work-life balance</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-8" data-testid="heading-openings">Open Positions</h2>
        <div className="space-y-4">
          {openings.map((job, index) => (
            <Card key={index} data-testid={`job-${index}`}>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.department} · {job.location} · {job.type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" data-testid={`button-apply-${index}`}>Apply Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
