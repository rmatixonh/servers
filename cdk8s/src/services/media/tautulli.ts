import {
  Deployment,
  DeploymentStrategy,
  Service,
  Volume,
} from "npm:cdk8s-plus-27";
import { Chart } from "npm:cdk8s";
import { withCommonLinuxServerProps } from "../../utils/linuxserver.ts";
import { createTailscaleIngress } from "../../utils/tailscale.ts";
import { LonghornVolume } from "../../utils/longhorn.ts";

export function createTautulliDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "tautulli", {
    replicas: 1,
    strategy: DeploymentStrategy.recreate(),
  });

  const longhornVolume = new LonghornVolume(chart, "tautulli-longhorn", {});

  deployment.addContainer(
    withCommonLinuxServerProps({
      image: "lscr.io/linuxserver/tautulli",
      portNumber: 8181,
      volumeMounts: [
        {
          path: "/config",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "tautulli-volume",
            longhornVolume.claim,
          ),
        },
      ],
    }),
  );

  const service = new Service(chart, "tautulli-service", {
    selector: deployment,
    ports: [{ port: 8181 }],
  });

  createTailscaleIngress(chart, "tautulli-ingress", {
    service,
    host: "tautulli",
  });
}
