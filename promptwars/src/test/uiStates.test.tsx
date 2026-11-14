import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// A representative UI component demonstrating Loading, Error, Empty, and Success states
interface DashboardStateViewProps {
  isLoading: boolean;
  error: string | null;
  items: Array<{ id: string; name: string; proficiency: number }>;
}

function DashboardStateView({ isLoading, error, items }: DashboardStateViewProps) {
  if (isLoading) {
    return (
      <Card data-testid="loading-state">
        <CardHeader>
          <CardTitle>Loading Career Metrics...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground animate-pulse">Synchronizing learner telemetry...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="error-state" className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button variant="outline" className="mt-2">Retry Connection</Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card data-testid="empty-state">
        <CardHeader>
          <CardTitle>No Skills Recorded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add your existing proficiencies in the Skills Manager to begin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="success-state">
      <CardHeader>
        <CardTitle>Verified Competencies ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between items-center">
              <span>{item.name}</span>
              <Badge variant="secondary">{item.proficiency}%</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

describe("Dashboard State Rendering (Loading, Error, Empty, Success)", () => {
  it("renders loading state with pulse indicator", () => {
    render(<DashboardStateView isLoading={true} error={null} items={[]} />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Loading Career Metrics...")).toBeInTheDocument();
  });

  it("renders error state when an error message is passed", () => {
    render(<DashboardStateView isLoading={false} error="Network timeout" items={[]} />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(screen.getByText("Retry Connection")).toBeInTheDocument();
  });

  it("renders empty state when no items are available", () => {
    render(<DashboardStateView isLoading={false} error={null} items={[]} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No Skills Recorded")).toBeInTheDocument();
  });

  it("renders success state with item metrics when data is present", () => {
    const items = [
      { id: "1", name: "TypeScript", proficiency: 85 },
      { id: "2", name: "Node.js", proficiency: 70 },
    ];
    render(<DashboardStateView isLoading={false} error={null} items={items} />);
    expect(screen.getByTestId("success-state")).toBeInTheDocument();
    expect(screen.getByText("Verified Competencies (2)")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });
});
