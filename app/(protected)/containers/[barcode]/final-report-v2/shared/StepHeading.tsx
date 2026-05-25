type StepHeadingProps = {
  n: number;
  title: string;
  sub?: string;
};

export const StepHeading = ({ n, title, sub }: StepHeadingProps) => (
  <div className="mb-5">
    <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      Step {n} of 6
    </div>
    <h1 className="m-0 mb-1.5 text-[24px] font-semibold tracking-[-0.015em]">
      {title}
    </h1>
    {sub ? (
      <p className="m-0 max-w-[620px] text-[14px] text-muted-foreground">
        {sub}
      </p>
    ) : null}
  </div>
);
