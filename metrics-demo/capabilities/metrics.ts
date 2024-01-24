import { Capability, a } from "pepr";

export const Metrics = new Capability({
  name: "metrics",
  description: "metrics demo",
  namespaces: ["metrics-demo"],
});

// Use the 'When' function to create a new action, use 'Store' to persist data
const { When } = Metrics;

When(a.Pod)
  .IsCreated()
  .Mutate(po => po.SetLabel("controller", "metrics"))
  .Validate(po => {
    if (po.HasLabel("pepr.dev/controller")) {
      return po.Approve();
    }
    return po.Deny("Pod must have label 'pepr.dev/controller'");
  });
