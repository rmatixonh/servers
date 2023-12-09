import {
  Deployment,
  Ingress,
  IngressBackend,
  Service,
} from "npm:cdk8s-plus-27";
import { ApiObject, Chart, JsonPatch } from "npm:cdk8s";

export function createOverseerrDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "overseerr", {
    replicas: 1,
  });

  deployment.addContainer({
    image: "lscr.io/linuxserver/overseerr",
    portNumber: 5055,
    securityContext: {
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
    resources: {},
  });

  const service = new Service(chart, "overseerr-service", {
    selector: deployment,
    ports: [{ port: 5055 }],
  });

  const ingress = new Ingress(chart, "overseerr-ingress", {
    defaultBackend: IngressBackend.fromService(service),
    tls: [
      {
        hosts: ["overseerr"],
      },
    ],
  });

  ApiObject.of(ingress).addJsonPatch(
    JsonPatch.add("/spec/ingressClassName", "tailscale")
  );

  ingress.metadata.addAnnotation("tailscale.com/funnel", "true");
}