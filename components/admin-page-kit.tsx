import type { ReactNode } from "react";

import { Card, Chip } from "@heroui/react";

export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export function AdminPage({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2">
              <Chip color="accent" size="sm" variant="soft">
                {eyebrow}
              </Chip>
            </div>
          ) : null}
          <h1 className="text-foreground text-2xl font-semibold tracking-normal sm:text-3xl">
            {title}
          </h1>
          <p className="text-muted mt-2 max-w-2xl text-sm">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </section>
      {children}
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: readonly {
    label: string;
    value: string;
    helper: string;
    tone?: StatusTone;
  }[];
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <Card.Header>
            <Card.Title className="text-sm">{stat.label}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-foreground text-2xl font-semibold tabular-nums">
              {stat.value}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={
                  stat.tone === "warning"
                    ? "bg-warning size-1.5 rounded-full"
                    : stat.tone === "danger"
                      ? "bg-danger size-1.5 rounded-full"
                      : stat.tone === "accent"
                        ? "bg-accent size-1.5 rounded-full"
                        : "bg-success size-1.5 rounded-full"
                }
              />
              <span className="text-muted text-xs">{stat.helper}</span>
            </div>
          </Card.Content>
        </Card>
      ))}
    </section>
  );
}

export function SectionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">{title}</Card.Title>
        {description ? (
          <Card.Description className="text-xs">{description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export function StatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <Chip color={tone} size="sm" variant="soft">
      {children}
    </Chip>
  );
}
